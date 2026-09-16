import { GET } from './route'
import { supabaseAdmin } from '@/lib/supabase'

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}))

jest.mock('@/lib/fecha', () => ({
  obtenerFechaCR: jest.fn(),
}))

import { obtenerFechaCR } from '@/lib/fecha'

const HOY = '2026-09-08'
const TABLAS_VACIAS = {
  adultos_mayores: [],
  prescripciones: [],
  historial_salud: [],
  usuarios: [{ id: 1, nombre: 'Admin', email: 'admin@centro.com', rol: 'admin', password_hash: 'hash-secreto' }],
}

function buildRequest(token = 'test-secret') {
  return {
    headers: {
      get: jest.fn().mockReturnValue(`Bearer ${token}`),
    },
  } as unknown as Request
}

function mockTablas(porTabla: Record<string, unknown[]>) {
  return jest.fn((tabla: string) => ({
    select: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: porTabla[tabla] ?? [], error: null }),
  }))
}

function fechaHaceDias(dias: number): string {
  const ms = Date.now() - dias * 24 * 60 * 60 * 1000
  return new Date(ms).toISOString().slice(0, 10)
}

// La decisión de saltar la generación compara contra la fecha "de hoy" mockeada (HOY),
// no contra el reloj real, así que el backup previo usado en ese chequeo debe calcularse
// respecto a HOY. La limpieza por retención, en cambio, sí usa Date.now() real (ver
// fechaHaceDias arriba), por eso son dos helpers distintos.
function diasAntesDeHoy(dias: number): string {
  const fecha = new Date(`${HOY}T00:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() - dias)
  return fecha.toISOString().slice(0, 10)
}

describe('/api/cron/backup-semanal', () => {
  let consoleErrorSpy: jest.SpyInstance
  const originalCronSecret = process.env.CRON_SECRET
  let mockStorageBucket: {
    list: jest.Mock
    upload: jest.Mock
    remove: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    process.env.CRON_SECRET = 'test-secret'
    ;(obtenerFechaCR as jest.Mock).mockReturnValue(HOY)

    mockStorageBucket = {
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      upload: jest.fn().mockResolvedValue({ error: null }),
      remove: jest.fn().mockResolvedValue({ error: null }),
    }
    ;(supabaseAdmin.storage.from as jest.Mock).mockReturnValue(mockStorageBucket)
    ;(supabaseAdmin.from as jest.Mock).mockImplementation(mockTablas(TABLAS_VACIAS))
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    process.env.CRON_SECRET = originalCronSecret
  })

  it('debe retornar 401 si el token del cron es inválido', async () => {
    const response = await GET(buildRequest('otro-token'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(mockStorageBucket.upload).not.toHaveBeenCalled()
  })

  it('debe retornar 500 si falla el listado de backups existentes', async () => {
    mockStorageBucket.list.mockResolvedValueOnce({ data: null, error: { message: 'bucket no disponible' } })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Error listando backups existentes: bucket no disponible')
    expect(mockStorageBucket.upload).not.toHaveBeenCalled()
  })

  it('debe saltar la generación cuando el último backup tiene menos de 7 días respecto a la fecha del sistema', async () => {
    mockStorageBucket.list.mockResolvedValueOnce({
      data: [{ name: 'backup-2026-09-03.sql' }],
      error: null,
    })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.generado).toBe(false)
    expect(data.mensaje).toContain('2026-09-03')
    expect(data.mensaje).toContain('5 dias')
    expect(mockStorageBucket.upload).not.toHaveBeenCalled()
  })

  it('debe generar el backup cuando el último backup tiene exactamente 7 días de antigüedad', async () => {
    mockStorageBucket.list.mockResolvedValueOnce({
      data: [{ name: 'backup-2026-09-01.sql' }],
      error: null,
    })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.generado).toBe(true)
    expect(mockStorageBucket.upload).toHaveBeenCalledTimes(1)
  })

  it('debe generar el backup cuando no existe ningún backup previo', async () => {
    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.generado).toBe(true)
    expect(data.archivo).toBe(`backup-${HOY}.sql`)
    expect(mockStorageBucket.upload).toHaveBeenCalledTimes(1)
  })

  it('debe ignorar archivos del bucket que no siguen el patrón backup-YYYY-MM-DD.sql al calcular el último backup', async () => {
    mockStorageBucket.list.mockResolvedValueOnce({
      data: [{ name: 'notas.txt' }, { name: 'backup-viejo.sql' }],
      error: null,
    })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(data.generado).toBe(true)
  })

  it('debe generar el backup aunque todas las tablas de negocio estén vacías, dejando comentarios "sin datos"', async () => {
    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.generado).toBe(true)

    const contenidoSQL = mockStorageBucket.upload.mock.calls[0][1] as string
    expect(contenidoSQL).toContain('-- Tabla "adultos_mayores": sin datos')
    expect(contenidoSQL).toContain('-- Tabla "prescripciones": sin datos')
    expect(contenidoSQL).toContain('-- Tabla "historial_salud": sin datos')
    expect(contenidoSQL).not.toContain('INSERT INTO adultos_mayores')
  })

  it('debe excluir el hash de contraseña de la tabla usuarios en el backup', async () => {
    const response = await GET(buildRequest())
    await response.json()

    const contenidoSQL = mockStorageBucket.upload.mock.calls[0][1] as string
    expect(contenidoSQL).toContain('INSERT INTO usuarios')
    expect(contenidoSQL).not.toContain('password_hash')
    expect(contenidoSQL).not.toContain('hash-secreto')
  })

  it('debe escapar comillas simples y representar correctamente nulos, booleanos y objetos en los valores del backup', async () => {
    ;(supabaseAdmin.from as jest.Mock).mockImplementation(
      mockTablas({
        ...TABLAS_VACIAS,
        adultos_mayores: [
          {
            id: 1,
            nombre: "O'Brien",
            telefono: null,
            pension_ivm: true,
            metadata: { nota: 'hola' },
          },
        ],
      })
    )

    const response = await GET(buildRequest())
    await response.json()

    const contenidoSQL = mockStorageBucket.upload.mock.calls[0][1] as string
    expect(contenidoSQL).toContain("'O''Brien'")
    expect(contenidoSQL).toMatch(/telefono.*NULL|NULL.*telefono/s)
    expect(contenidoSQL).toContain('TRUE')
    expect(contenidoSQL).toContain('{"nota":"hola"}')
  })

  it('debe acumular filas de múltiples páginas cuando una tabla supera el tamaño de página', async () => {
    const primeraPagina = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1 }))
    const segundaPagina = [{ id: 1001 }, { id: 1002 }]

    const rangeMock = jest
      .fn()
      .mockResolvedValueOnce({ data: primeraPagina, error: null })
      .mockResolvedValueOnce({ data: segundaPagina, error: null })

    ;(supabaseAdmin.from as jest.Mock).mockImplementation((tabla: string) => {
      if (tabla === 'adultos_mayores') {
        return { select: jest.fn().mockReturnThis(), range: rangeMock }
      }
      return mockTablas(TABLAS_VACIAS)(tabla)
    })

    const response = await GET(buildRequest())
    await response.json()

    expect(rangeMock).toHaveBeenCalledTimes(2)
    expect(rangeMock).toHaveBeenNthCalledWith(1, 0, 999)
    expect(rangeMock).toHaveBeenNthCalledWith(2, 1000, 1999)

    const contenidoSQL = mockStorageBucket.upload.mock.calls[0][1] as string
    const coincidencias = contenidoSQL.match(/INSERT INTO adultos_mayores/g) ?? []
    expect(coincidencias).toHaveLength(1002)
  })

  it('debe retornar 500 si falla la consulta de alguna tabla', async () => {
    ;(supabaseAdmin.from as jest.Mock).mockImplementation((tabla: string) => {
      if (tabla === 'prescripciones') {
        return {
          select: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({ data: null, error: { message: 'tabla bloqueada' } }),
        }
      }
      return mockTablas(TABLAS_VACIAS)(tabla)
    })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Error consultando prescripciones')
    expect(data.error).toContain('tabla bloqueada')
    expect(mockStorageBucket.upload).not.toHaveBeenCalled()
  })

  it('debe retornar 500 si falla la subida del backup al storage', async () => {
    mockStorageBucket.upload.mockResolvedValueOnce({ error: { message: 'sin espacio' } })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Error subiendo backup: sin espacio')
  })

  it('debe eliminar backups con más de 6 semanas de antigüedad tras subir el nuevo', async () => {
    const archivoViejo = `backup-${fechaHaceDias(50)}.sql`
    const archivoReciente = `backup-${fechaHaceDias(10)}.sql`

    mockStorageBucket.list
      .mockResolvedValueOnce({ data: [{ name: `backup-${diasAntesDeHoy(10)}.sql` }], error: null })
      .mockResolvedValueOnce({ data: [{ name: archivoViejo }, { name: archivoReciente }], error: null })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.backupsEliminados).toBe(1)
    expect(data.archivosEliminados).toEqual([archivoViejo])
    expect(mockStorageBucket.remove).toHaveBeenCalledWith([archivoViejo])
  })

  it('no debe eliminar backups dentro del período de retención de 6 semanas', async () => {
    const archivoReciente = `backup-${fechaHaceDias(10)}.sql`

    mockStorageBucket.list
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [{ name: archivoReciente }], error: null })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(data.backupsEliminados).toBe(0)
    expect(mockStorageBucket.remove).not.toHaveBeenCalled()
  })

  it('no debe fallar la respuesta si el listado de limpieza falla, solo se registra el error', async () => {
    mockStorageBucket.list
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'error temporal' } })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.generado).toBe(true)
    expect(data.backupsEliminados).toBe(0)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error listando backups para limpieza:',
      'error temporal'
    )
  })

  it('no debe fallar la respuesta si la eliminación de backups viejos falla, solo se registra el error', async () => {
    const archivoViejo = `backup-${fechaHaceDias(50)}.sql`

    mockStorageBucket.list
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [{ name: archivoViejo }], error: null })
    mockStorageBucket.remove.mockResolvedValueOnce({ error: { message: 'no se pudo borrar' } })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.backupsEliminados).toBe(0)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error eliminando backups viejos:',
      'no se pudo borrar'
    )
  })

  it('debe retornar 500 cuando ocurre un error inesperado', async () => {
    ;(supabaseAdmin.storage.from as jest.Mock).mockImplementation(() => {
      throw new Error('fallo inesperado')
    })

    const response = await GET(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('fallo inesperado')
  })
})
