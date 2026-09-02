import { POST } from './route'
import { supabaseAdmin } from '@/lib/supabase'

var mockSendMail = jest.fn()

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
  },
}))

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
})