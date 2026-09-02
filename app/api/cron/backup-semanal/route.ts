import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { obtenerFechaCR } from '@/lib/fecha'

const TABLAS_BACKUP = ['adultos_mayores', 'prescripciones', 'historial_salud', 'usuarios'] as const
const CAMPOS_EXCLUIDOS: Partial<Record<(typeof TABLAS_BACKUP)[number], string[]>> = {
  usuarios: ['password_hash'],
}
const BUCKET_BACKUPS = 'backups'
const RETENCION_SEMANAS = 6
const INTERVALO_MINIMO_DIAS = 7
const TAMANO_PAGINA = 1000
const PATRON_NOMBRE_BACKUP = /^backup-(\d{4}-\d{2}-\d{2})\.sql$/

function escaparValorSQL(valor: unknown): string {
  if (valor === null || valor === undefined) return 'NULL'
  if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : 'NULL'
  if (typeof valor === 'boolean') return valor ? 'TRUE' : 'FALSE'
  if (typeof valor === 'object') return `'${JSON.stringify(valor).replace(/'/g, "''")}'`
  return `'${String(valor).replace(/'/g, "''")}'`
}

async function obtenerFilas(tabla: string): Promise<Record<string, unknown>[]> {
  const filas: Record<string, unknown>[] = []
  let desde = 0

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(tabla)
      .select('*')
      .range(desde, desde + TAMANO_PAGINA - 1)

    if (error) throw new Error(`Error consultando ${tabla}: ${error.message}`)
    if (!data || data.length === 0) break

    filas.push(...data)
    if (data.length < TAMANO_PAGINA) break
    desde += TAMANO_PAGINA
  }

  return filas
}

function generarInsertsTabla(tabla: string, filas: Record<string, unknown>[]): string {
  if (filas.length === 0) {
    return `-- Tabla "${tabla}": sin datos\n`
  }

  const excluidos = CAMPOS_EXCLUIDOS[tabla as (typeof TABLAS_BACKUP)[number]] ?? []
  const columnas = Object.keys(filas[0]).filter(columna => !excluidos.includes(columna))

  const lineas = filas.map(fila => {
    const valores = columnas.map(columna => escaparValorSQL(fila[columna]))
    return `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${valores.join(', ')});`
  })

  return `-- Tabla "${tabla}" (${filas.length} filas)\n${lineas.join('\n')}\n`
}

/** Fecha (YYYY-MM-DD) del backup mas reciente en el bucket, segun el nombre de archivo, o null si no hay ninguno. */
function obtenerFechaUltimoBackup(nombresArchivos: string[]): string | null {
  const fechas = nombresArchivos
    .map(nombre => nombre.match(PATRON_NOMBRE_BACKUP)?.[1])
    .filter((fecha): fecha is string => Boolean(fecha))

  if (fechas.length === 0) return null
  return fechas.sort().at(-1)!
}

function diasEntreFechas(fechaAnteriorISO: string, fechaActualISO: string): number {
  const msPorDia = 24 * 60 * 60 * 1000
  const anteriorMs = new Date(`${fechaAnteriorISO}T00:00:00Z`).getTime()
  const actualMs = new Date(`${fechaActualISO}T00:00:00Z`).getTime()
  return Math.floor((actualMs - anteriorMs) / msPorDia)
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fecha = obtenerFechaCR()

    const { data: archivosExistentes, error: errorListadoPrevio } = await supabaseAdmin.storage
      .from(BUCKET_BACKUPS)
      .list()

    if (errorListadoPrevio) {
      return NextResponse.json(
        { success: false, error: `Error listando backups existentes: ${errorListadoPrevio.message}` },
        { status: 500 }
      )
    }

    const fechaUltimoBackup = obtenerFechaUltimoBackup((archivosExistentes ?? []).map(archivo => archivo.name))

    if (fechaUltimoBackup !== null) {
      const diasTranscurridos = diasEntreFechas(fechaUltimoBackup, fecha)
      if (diasTranscurridos < INTERVALO_MINIMO_DIAS) {
        return NextResponse.json({
          success: true,
          generado: false,
          mensaje: `Se salteo la generacion: el ultimo backup fue el ${fechaUltimoBackup} (hace ${diasTranscurridos} dias) y todavia no pasaron ${INTERVALO_MINIMO_DIAS} dias.`,
        })
      }
    }

    const bloquesSQL: string[] = [`-- Backup generado automaticamente el ${fecha}`, 'BEGIN;', '']

    for (const tabla of TABLAS_BACKUP) {
      const filas = await obtenerFilas(tabla)
      bloquesSQL.push(generarInsertsTabla(tabla, filas))
    }

    bloquesSQL.push('COMMIT;')
    const contenidoSQL = bloquesSQL.join('\n')

    const nombreArchivo = `backup-${fecha}.sql`
    const { error: errorSubida } = await supabaseAdmin.storage
      .from(BUCKET_BACKUPS)
      .upload(nombreArchivo, contenidoSQL, {
        contentType: 'application/sql',
        upsert: true,
      })

    if (errorSubida) {
      return NextResponse.json(
        { success: false, error: `Error subiendo backup: ${errorSubida.message}` },
        { status: 500 }
      )
    }

    // Retencion limitada: se eliminan los backups con mas de RETENCION_SEMANAS de antiguedad
    // segun la fecha codificada en el nombre del archivo (backup-YYYY-MM-DD.sql).
    let archivosEliminados: string[] = []
    const { data: archivos, error: errorListado } = await supabaseAdmin.storage
      .from(BUCKET_BACKUPS)
      .list()

    if (errorListado) {
      console.error('Error listando backups para limpieza:', errorListado.message)
    } else if (archivos) {
      const limiteMs = RETENCION_SEMANAS * 7 * 24 * 60 * 60 * 1000
      const ahora = Date.now()

      const archivosViejos = archivos
        .map(archivo => archivo.name)
        .filter(nombre => {
          const coincidencia = nombre.match(PATRON_NOMBRE_BACKUP)
          if (!coincidencia) return false
          const fechaArchivoMs = new Date(`${coincidencia[1]}T00:00:00Z`).getTime()
          return ahora - fechaArchivoMs > limiteMs
        })

      if (archivosViejos.length > 0) {
        const { error: errorEliminar } = await supabaseAdmin.storage
          .from(BUCKET_BACKUPS)
          .remove(archivosViejos)

        if (errorEliminar) {
          console.error('Error eliminando backups viejos:', errorEliminar.message)
        } else {
          archivosEliminados = archivosViejos
        }
      }
    }

    return NextResponse.json({
      success: true,
      generado: true,
      archivo: nombreArchivo,
      backupsEliminados: archivosEliminados.length,
      archivosEliminados,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
