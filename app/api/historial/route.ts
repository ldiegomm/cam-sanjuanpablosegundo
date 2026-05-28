import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type HistorialRow = {
  id: number
  id_adulto_mayor: number
  fuma: boolean | null
  consume_licor: boolean | null
  padecimientos: unknown
  lesiones: unknown
  operaciones: string | null
  cantidad_ejersicio_demanal: number | null
}

type HistorialInput = {
  id_adulto_mayor: number
  fuma: boolean
  consume_licor: boolean
  padecimientos: string
  lesiones: string
  operaciones: string
  cantidad_ejersicio_demanal: number
}

function parseTextToList(value: string): string[] {
  return value
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function listFormats(text: string) {
  const trimmed = text.trim()
  const list = parseTextToList(trimmed)

  return [
    trimmed,
    list,
    JSON.stringify(list),
    list.join(', ')
  ]
}

function normalizeRow(row: Record<string, unknown>): HistorialRow {
  const cantidadRaw =
    row.cantidad_ejersicio_demanal ??
    row.cantidad_ejercicio_semanal

  return {
    id: Number(row.id),
    id_adulto_mayor: Number(row.id_adulto_mayor),
    fuma: typeof row.fuma === 'boolean' ? row.fuma : null,
    consume_licor: typeof row.consume_licor === 'boolean' ? row.consume_licor : null,
    padecimientos: row.padecimientos ?? null,
    lesiones: row.lesiones ?? null,
    operaciones: typeof row.operaciones === 'string' ? row.operaciones : null,
    cantidad_ejersicio_demanal:
      typeof cantidadRaw === 'number'
        ? cantidadRaw
        : Number.isFinite(Number(cantidadRaw))
          ? Number(cantidadRaw)
          : null
  }
}

function buildPayloadVariants(input: HistorialInput) {
  const base = {
    fuma: input.fuma,
    consume_licor: input.consume_licor,
    operaciones: input.operaciones || null
  }

  const padecimientosVariants = listFormats(input.padecimientos)
  const lesionesVariants = listFormats(input.lesiones)
  const ejercicioVariants = [
    { cantidad_ejersicio_demanal: input.cantidad_ejersicio_demanal },
    { cantidad_ejercicio_semanal: input.cantidad_ejersicio_demanal }
  ]

  const variants: Record<string, unknown>[] = []
  for (const padecimientos of padecimientosVariants) {
    for (const lesiones of lesionesVariants) {
      for (const ejercicio of ejercicioVariants) {
        variants.push({
          ...base,
          padecimientos,
          lesiones,
          ...ejercicio
        })
      }
    }
  }

  const seen = new Set<string>()
  return variants.filter((variant) => {
    const key = JSON.stringify(variant)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function saveHistorial(input: HistorialInput): Promise<HistorialRow> {
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from('historial_salud')
    .select('id')
    .eq('id_adulto_mayor', input.id_adulto_mayor)
    .order('id', { ascending: false })
    .limit(1)

  if (existingError) throw existingError

  const existingId = existingRows?.[0]?.id
  const variants = buildPayloadVariants(input)
  let lastError: unknown = null

  for (const payload of variants) {
    if (existingId) {
      const { data, error } = await supabaseAdmin
        .from('historial_salud')
        .update(payload)
        .eq('id', existingId)
        .select('*')
        .single()

      if (!error && data) return normalizeRow(data as Record<string, unknown>)
      lastError = error
      continue
    }

    const { data, error } = await supabaseAdmin
      .from('historial_salud')
      .insert([{ ...payload, id_adulto_mayor: input.id_adulto_mayor }])
      .select('*')
      .single()

    if (!error && data) return normalizeRow(data as Record<string, unknown>)
    lastError = error
  }

  throw lastError ?? new Error('No se pudo guardar el historial de salud.')
}

export async function GET() {
  try {
    const [{ data: adultos, error: adultosError }, { data: historialRows, error: historialError }] = await Promise.all([
      supabaseAdmin
        .from('adultos_mayores')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre'),
      supabaseAdmin
        .from('historial_salud')
        .select('*')
        .order('id', { ascending: false })
    ])

    if (adultosError) throw adultosError
    if (historialError) throw historialError

    const historialPorAdulto = new Map<number, HistorialRow>()

    for (const rawRow of (historialRows ?? []) as Record<string, unknown>[]) {
      const row = normalizeRow(rawRow)
      if (!row.id_adulto_mayor) continue
      if (!historialPorAdulto.has(row.id_adulto_mayor)) {
        historialPorAdulto.set(row.id_adulto_mayor, row)
      }
    }

    return NextResponse.json({
      adultos: adultos ?? [],
      historial: Array.from(historialPorAdulto.values())
    })
  } catch (error) {
    console.error('Error obteniendo historial de salud:', error)
    return NextResponse.json({ adultos: [], historial: [] }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      id_adulto_mayor?: unknown
      fuma?: unknown
      consume_licor?: unknown
      padecimientos?: string | unknown[]
      lesiones?: string | unknown[]
      operaciones?: unknown
      cantidad_ejersicio_demanal?: unknown
    }

    if (!body.id_adulto_mayor || !Number.isFinite(body.id_adulto_mayor)) {
      return NextResponse.json({ success: false, message: 'Paciente inválido.' }, { status: 400 })
    }

    const payload: HistorialInput = {
      id_adulto_mayor: Number(body.id_adulto_mayor),
      fuma: Boolean(body.fuma),
      consume_licor: Boolean(body.consume_licor),
      padecimientos: typeof body.padecimientos === 'string'
        ? body.padecimientos
        : Array.isArray(body.padecimientos)
          ? body.padecimientos.map(String).join(', ')
          : '',
      lesiones: typeof body.lesiones === 'string'
        ? body.lesiones
        : Array.isArray(body.lesiones)
          ? body.lesiones.map(String).join(', ')
          : '',
      operaciones: typeof body.operaciones === 'string' ? body.operaciones.trim() : '',
      cantidad_ejersicio_demanal: Number.isFinite(Number(body.cantidad_ejersicio_demanal))
        ? Math.max(0, Math.min(7, Number(body.cantidad_ejersicio_demanal)))
        : 0
    }

    const saved = await saveHistorial(payload)

    return NextResponse.json({ success: true, historial: saved })
  } catch (error) {
    console.error('Error guardando historial de salud:', error)
    return NextResponse.json(
      { success: false, message: 'No fue posible guardar el historial.' },
      { status: 500 }
    )
  }
}
