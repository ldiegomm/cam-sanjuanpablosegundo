import { GET, PUT } from './route'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

jest.mock('@/lib/auth')
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

describe('/api/configuracion-notificaciones', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('GET', () => {
    it('debe retornar 401 si no hay sesión', async () => {
      ;(getSession as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toBe('No autenticado.')
    })

    it('debe retornar la configuración de notificaciones cuando hay sesión', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ userId: '1', rol: 'admin' })

      const configuracion = {
        id: 1,
        activo: true,
        correo_destino: 'avisos@centro.com',
        lunes: true,
        martes: true,
        miercoles: true,
        jueves: true,
        viernes: true,
        sabado: false,
        domingo: false,
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: configuracion, error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.configuracion).toEqual(configuracion)
    })

    it('debe retornar 500 si falla la consulta a Supabase', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ userId: '1', rol: 'admin' })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Error al obtener la configuración de notificaciones.')
    })
  })

  describe('PUT', () => {
    it('debe retornar 403 si el usuario no es administrador', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ userId: '1', rol: 'colaborador' })

      const request = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Request

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.message).toBe('No autorizado.')
    })

    it('debe permitir apagar las notificaciones guardando activo en false', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ userId: '1', rol: 'admin' })

      const payload = {
        activo: false,
        correo_destino: ' avisos@centro.com ',
        domingo: false,
        lunes: false,
        martes: false,
        miercoles: false,
        jueves: false,
        viernes: false,
        sabado: false,
      }

      const request = {
        json: jest.fn().mockResolvedValue(payload),
      } as unknown as Request

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 1, ...payload, correo_destino: 'avisos@centro.com' },
          error: null,
        }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        activo: false,
        correo_destino: 'avisos@centro.com',
      }))
    })

    it('debe retornar 400 si el correo destino es inválido', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ userId: '1', rol: 'admin' })

      const request = {
        json: jest.fn().mockResolvedValue({
          activo: true,
          correo_destino: 'correo-invalido',
          domingo: true,
          lunes: true,
          martes: true,
          miercoles: true,
          jueves: true,
          viernes: true,
          sabado: true,
        }),
      } as unknown as Request

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('El correo destino no es válido.')
    })

    it('debe retornar 400 si falta el campo activo', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ userId: '1', rol: 'admin' })

      const request = {
        json: jest.fn().mockResolvedValue({
          correo_destino: 'avisos@centro.com',
          domingo: true,
          lunes: true,
          martes: true,
          miercoles: true,
          jueves: true,
          viernes: true,
          sabado: true,
        }),
      } as unknown as Request

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('El campo activo es requerido y debe ser verdadero o falso.')
    })

    it('debe retornar 400 si falta un campo de día de la semana', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ userId: '1', rol: 'admin' })

      const request = {
        json: jest.fn().mockResolvedValue({
          activo: true,
          correo_destino: 'avisos@centro.com',
          domingo: true,
          lunes: true,
          martes: true,
          miercoles: true,
          jueves: true,
          viernes: true,
          // falta "sabado"
        }),
      } as unknown as Request

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('El campo sabado es requerido y debe ser verdadero o falso.')
    })

    it('debe retornar 500 si falla la actualización en Supabase', async () => {
      ;(getSession as jest.Mock).mockResolvedValue({ userId: '1', rol: 'admin' })

      const request = {
        json: jest.fn().mockResolvedValue({
          activo: true,
          correo_destino: 'avisos@centro.com',
          domingo: true,
          lunes: true,
          martes: true,
          miercoles: true,
          jueves: true,
          viernes: true,
          sabado: true,
        }),
      } as unknown as Request

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Error al actualizar la configuración de notificaciones.')
    })
  })
})