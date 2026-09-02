import { POST } from './route'
import { supabaseAdmin } from '@/lib/supabase'

// El transporter (y su sendMail) se crean dentro de la propia factory, no en una
// variable externa: jest.mock() se hoistea por encima de los imports/requires, así
// que para cuando route.ts pide "nodemailer" y llama a createTransport(), una
// variable declarada afuera con `var` todavía no habría sido asignada. createTransport
// siempre retorna el mismo objeto "transporter" (capturado por closure), así que
// route.ts y este archivo de test terminan compartiendo la misma instancia de sendMail.
jest.mock('nodemailer', () => {
  const transporter = { sendMail: jest.fn() }
  return {
    __esModule: true,
    default: { createTransport: jest.fn(() => transporter) },
  }
})

const mockSendMail = (jest.requireMock('nodemailer') as { default: { createTransport: () => { sendMail: jest.Mock } } })
  .default.createTransport().sendMail

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('@/lib/fecha', () => ({
  obtenerDiaSemanaCR: jest.fn(() => 'miercoles'),
  formatearFechaLarga: jest.fn(() => 'miércoles 2 de septiembre de 2026'),
}))

describe('/api/emails/reporte-medicamentos', () => {
  let consoleErrorSpy: jest.SpyInstance
  const originalCronSecret = process.env.CRON_SECRET

  beforeEach(() => {
    jest.clearAllMocks()
    mockSendMail.mockReset()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    process.env.CRON_SECRET = 'test-secret'
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    process.env.CRON_SECRET = originalCronSecret
  })

  it('debe retornar 401 si el token del cron es inválido', async () => {
    const request = {
      headers: {
        get: jest.fn().mockReturnValue('Bearer otro-token'),
      },
      json: jest.fn().mockResolvedValue({ fecha: '2026-09-02' }),
    } as unknown as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('debe omitir el envío cuando las notificaciones están desactivadas', async () => {
    const mockConfigQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          activo: false,
          correo_destino: 'avisos@centro.com',
          domingo: true,
          lunes: true,
          martes: true,
          miercoles: true,
          jueves: true,
          viernes: true,
          sabado: true,
        },
        error: null,
      }),
    }

    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockConfigQuery)

    const request = {
      headers: {
        get: jest.fn().mockReturnValue('Bearer test-secret'),
      },
      json: jest.fn().mockResolvedValue({ fecha: '2026-09-02' }),
    } as unknown as Request

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Las notificaciones de medicamentos están desactivadas')
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  function buildRequest(fecha = '2026-09-02') {
    return {
      headers: {
        get: jest.fn().mockReturnValue('Bearer test-secret'),
      },
      json: jest.fn().mockResolvedValue({ fecha }),
    } as unknown as Request
  }

  const CONFIG_BASE = {
    activo: true,
    correo_destino: 'avisos@centro.com',
    domingo: true,
    lunes: true,
    martes: true,
    miercoles: true,
    jueves: true,
    viernes: true,
    sabado: true,
  }

  it('debe omitir el envío cuando no se encuentra la configuración de notificaciones', async () => {
    const mockConfigQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockConfigQuery)

    const response = await POST(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('No se encontró la configuración de notificaciones, se omite el envío del correo')
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('debe retornar 500 si falla la consulta de configuración', async () => {
    const mockConfigQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockConfigQuery)

    const response = await POST(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('db down')
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('debe omitir el envío cuando hoy no corresponde según los días configurados', async () => {
    const mockConfigQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { ...CONFIG_BASE, miercoles: false },
        error: null,
      }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockConfigQuery)

    const response = await POST(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Hoy no corresponde enviar el reporte según la configuración')
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('debe omitir el envío cuando falta el correo destino', async () => {
    const mockConfigQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { ...CONFIG_BASE, correo_destino: null },
        error: null,
      }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockConfigQuery)

    const response = await POST(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Falta configurar el correo destino de las notificaciones, se omite el envío del correo')
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('debe retornar 500 si falla la consulta de pacientes', async () => {
    const mockConfigQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: CONFIG_BASE, error: null }),
    }
    const mockPacientesQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: 'query falló' } }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockImplementation((table: string) =>
      table === 'configuracion_notificaciones' ? mockConfigQuery : mockPacientesQuery
    )

    const response = await POST(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('query falló')
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('debe omitir el envío cuando ningún paciente tiene medicamentos programados hoy', async () => {
    const mockConfigQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: CONFIG_BASE, error: null }),
    }
    const mockPacientesQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{ nombre: 'Ana Mora', cedula: '1-1111-1111', prescripciones: [] }],
        error: null,
      }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockImplementation((table: string) =>
      table === 'configuracion_notificaciones' ? mockConfigQuery : mockPacientesQuery
    )

    const response = await POST(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('No hay medicamentos programados para hoy')
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('debe enviar el correo con el detalle de medicamentos cuando todo es correcto', async () => {
    const mockConfigQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: CONFIG_BASE, error: null }),
    }
    const mockPacientesQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            nombre: 'Ana Mora',
            cedula: '1-1111-1111',
            prescripciones: [
              {
                nombre_medicamento: 'Panadol',
                dosis: '500mg',
                indicaciones: 'Con comida',
                ayunas: false,
                desayuno: true,
                media_manana: false,
                almuerzo: false,
                merienda_tarde: false,
                cena: false,
                acostarse: false,
                lunes: false,
                martes: false,
                miercoles: true,
                jueves: false,
                viernes: false,
                sabado: false,
                domingo: false,
              },
            ],
          },
        ],
        error: null,
      }),
    }
    ;(supabaseAdmin.from as jest.Mock).mockImplementation((table: string) =>
      table === 'configuracion_notificaciones' ? mockConfigQuery : mockPacientesQuery
    )
    mockSendMail.mockResolvedValue({ messageId: 'msg-123' })

    const response = await POST(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.messageId).toBe('msg-123')
    expect(data.adultos).toBe(1)
    expect(data.medicamentos).toBe(1)
    expect(mockSendMail).toHaveBeenCalledTimes(1)

    const sentMail = mockSendMail.mock.calls[0][0]
    expect(sentMail.to).toEqual(['avisos@centro.com'])
    expect(sentMail.html).toContain('Panadol 500mg')
    expect(sentMail.html).toContain('Ana Mora')
  })

  it('debe retornar 500 cuando ocurre un error inesperado', async () => {
    const mockConfigQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockRejectedValue(new Error('fallo inesperado')),
    }
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockConfigQuery)

    const response = await POST(buildRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('fallo inesperado')
  })
})