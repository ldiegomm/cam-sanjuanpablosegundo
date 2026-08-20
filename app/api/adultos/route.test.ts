import { GET, POST } from './route'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Mock dependencies
jest.mock('@/lib/auth')
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

describe('/api/adultos', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    // Suprimir console.error durante las pruebas
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('GET', () => {
    it('debe retornar 401 si no hay sesión', async () => {
      (getSession as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toBe('No autenticado.')
    })

    it('debe retornar lista de adultos mayores con historial', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      const mockAdultos = [
        {
          id: 1,
          nombre: 'Juan Pérez',
          cedula: '123456789',
          fecha_nacimiento: '1950-01-01',
          sexo: 'M',
          prescripciones: [{ id: 1 }],
        },
      ]
      const mockHistorial = [
        { id: 1, id_adulto_mayor: 1 },
        { id: 2, id_adulto_mayor: 1 },
      ]

      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockQueryAdultos = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAdultos, error: null }),
      }

      const mockQueryHistorial = {
        select: jest.fn().mockResolvedValue({ data: mockHistorial, error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQueryAdultos)
        .mockReturnValueOnce(mockQueryHistorial)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.adultos).toHaveLength(1)
      expect(data.adultos[0].historial_salud).toHaveLength(2)
      expect(data.adultos[0].nombre).toBe('Juan Pérez')
    })

    it('debe manejar error de consulta de adultos', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.adultos).toEqual([])
    })

    it('debe agrupar historial correctamente por adulto mayor', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      const mockAdultos = [
        { id: 1, nombre: 'Adulto 1', prescripciones: [] },
        { id: 2, nombre: 'Adulto 2', prescripciones: [] },
      ]
      const mockHistorial = [
        { id: 1, id_adulto_mayor: 1 },
        { id: 2, id_adulto_mayor: 1 },
        { id: 3, id_adulto_mayor: 2 },
      ]

      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockQueryAdultos = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAdultos, error: null }),
      }

      const mockQueryHistorial = {
        select: jest.fn().mockResolvedValue({ data: mockHistorial, error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQueryAdultos)
        .mockReturnValueOnce(mockQueryHistorial)

      const response = await GET()
      const data = await response.json()

      expect(data.adultos[0].historial_salud).toHaveLength(2)
      expect(data.adultos[1].historial_salud).toHaveLength(1)
    })
  })

  describe('POST', () => {
    it('debe retornar 401 si no hay sesión', async () => {
      (getSession as jest.Mock).mockResolvedValue(null)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.message).toBe('No autenticado.')
    })

    it('debe crear un adulto mayor exitosamente', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      const mockAdultoData = {
        nombre: 'Juan Pérez',
        cedula: '123456789',
        fecha_nacimiento: '1950-01-01',
        sexo: 'M',
      }
      const mockCreatedAdulto = { id: 1, ...mockAdultoData, activo: true }

      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue(mockAdultoData),
      } as unknown as Request

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedAdulto, error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.adulto).toEqual(mockCreatedAdulto)
      expect(mockQuery.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          nombre: mockAdultoData.nombre,
          cedula: mockAdultoData.cedula,
          activo: true,
        }),
      ])
    })

    it('debe manejar campos opcionales correctamente', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      const mockAdultoData = {
        nombre: 'Juan Pérez',
        cedula: '123456789',
        fecha_nacimiento: '1950-01-01',
        sexo: 'M',
        telefono: '12345678',
        pension_ivm: true,
        familiar_nombre: 'María Pérez',
      }

      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue(mockAdultoData),
      } as unknown as Request

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 1, ...mockAdultoData },
          error: null,
        }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      await POST(mockRequest)

      expect(mockQuery.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          telefono: '12345678',
          pension_ivm: true,
          familiar_nombre: 'María Pérez',
        }),
      ])
    })

    it('debe manejar error de inserción', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          nombre: 'Test',
          cedula: '123',
          fecha_nacimiento: '1950-01-01',
          sexo: 'M',
        }),
      } as unknown as Request

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Insert failed'),
        }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
