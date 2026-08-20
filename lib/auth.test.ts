import { getSession, requireAuth } from './auth'
import { cookies } from 'next/headers'

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('auth utilities', () => {
  const mockCookies = cookies as jest.MockedFunction<typeof cookies>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSession', () => {
    it('debe retornar null si no existe la cookie de sesión', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
        set: jest.fn(),
        delete: jest.fn(),
      } as any)

      const result = await getSession()
      expect(result).toBeNull()
    })

    it('debe retornar la sesión parseada cuando la cookie es válida', async () => {
      const mockSession = { userId: '123', email: 'test@example.com', role: 'admin' }
      
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: JSON.stringify(mockSession) }),
        set: jest.fn(),
        delete: jest.fn(),
      } as any)

      const result = await getSession()
      expect(result).toEqual(mockSession)
    })

    it('debe retornar null si la cookie no contiene JSON válido', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'invalid-json' }),
        set: jest.fn(),
        delete: jest.fn(),
      } as any)

      const result = await getSession()
      expect(result).toBeNull()
    })

    it('debe manejar cookies con JSON malformado', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: '{"userId": "123"' }),
        set: jest.fn(),
        delete: jest.fn(),
      } as any)

      const result = await getSession()
      expect(result).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('debe retornar la sesión si existe', async () => {
      const mockSession = { userId: '123', email: 'test@example.com', role: 'admin' }
      
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: JSON.stringify(mockSession) }),
        set: jest.fn(),
        delete: jest.fn(),
      } as any)

      const result = await requireAuth()
      expect(result).toEqual(mockSession)
    })

    it('debe lanzar un error si no existe la sesión', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue(undefined),
        set: jest.fn(),
        delete: jest.fn(),
      } as any)

      await expect(requireAuth()).rejects.toThrow('No autenticado')
    })

    it('debe lanzar un error si la cookie es inválida', async () => {
      mockCookies.mockResolvedValue({
        get: jest.fn().mockReturnValue({ value: 'invalid-json' }),
        set: jest.fn(),
        delete: jest.fn(),
      } as any)

      await expect(requireAuth()).rejects.toThrow('No autenticado')
    })
  })
})
