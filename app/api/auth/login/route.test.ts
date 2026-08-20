import { POST } from './route'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

describe('/api/auth/login', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    // Suprimir console.error durante las pruebas
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('POST', () => {
    it('debe retornar 400 si falta el email', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ password: 'password123' }),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Email y contraseña son requeridos')
    })

    it('debe retornar 400 si falta la contraseña', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Email y contraseña son requeridos')
    })

    it('debe retornar 401 si el usuario no existe', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          email: 'noexiste@example.com',
          password: 'password123',
        }),
      } as unknown as Request

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Credenciales incorrectas')
    })

    it('debe retornar 401 si la contraseña es incorrecta', async () => {
      const mockUsuario = {
        id: 1,
        email: 'test@example.com',
        nombre: 'Test User',
        rol: 'admin',
        password_hash: 'hashed_password',
        activo: true,
      }

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      } as unknown as Request

      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockUsuario], error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockSelectQuery)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Credenciales incorrectas')
    })

    it('debe autenticar exitosamente con credenciales correctas', async () => {
      const mockUsuario = {
        id: 1,
        email: 'test@example.com',
        nombre: 'Test User',
        rol: 'admin',
        password_hash: 'hashed_password',
        activo: true,
        ultimo_acceso: null,
      }

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'correctpassword',
        }),
      } as unknown as Request

      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockUsuario], error: null }),
      }

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery)
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Login exitoso')
      expect(data.usuario).toEqual({
        id: 1,
        email: 'test@example.com',
        nombre: 'Test User',
        rol: 'admin',
        activo: true,
        ultimo_acceso: null,
      })
      expect(data.usuario.password_hash).toBeUndefined()
    })

    it('debe actualizar el último acceso al hacer login', async () => {
      const mockUsuario = {
        id: 1,
        email: 'test@example.com',
        nombre: 'Test User',
        rol: 'admin',
        password_hash: 'hashed_password',
        activo: true,
      }

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'correctpassword',
        }),
      } as unknown as Request

      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockUsuario], error: null }),
      }

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery)
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await POST(mockRequest)

      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        ultimo_acceso: expect.any(String),
      })
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', 1)
    })

    it('debe establecer cookie de sesión al hacer login exitoso', async () => {
      const mockUsuario = {
        id: 1,
        email: 'test@example.com',
        nombre: 'Test User',
        rol: 'admin',
        password_hash: 'hashed_password',
        activo: true,
      }

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'correctpassword',
        }),
      } as unknown as Request

      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockUsuario], error: null }),
      }

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockUpdateQuery)
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const response = await POST(mockRequest)

      // Verificar que la cookie fue establecida
      const cookieHeader = response.headers.get('set-cookie')
      expect(cookieHeader).toContain('user_session=')
      expect(cookieHeader).toContain('HttpOnly')
      expect(cookieHeader).toMatch(/SameSite=(Lax|lax)/)
    })

    it('debe manejar error de base de datos al buscar usuario', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          email: 'test@example.com',
          password: 'password123',
        }),
      } as unknown as Request

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Error en el sistema')
    })

    it('debe manejar excepción no esperada', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Error en el sistema')
    })
  })
})
