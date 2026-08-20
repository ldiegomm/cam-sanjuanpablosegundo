import { GET, POST } from './route'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Mock dependencies
jest.mock('@/lib/auth')
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

describe('/api/medicamentos', () => {
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

    it('debe retornar adultos y prescripciones exitosamente', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      const mockAdultos = [
        { id: 1, nombre: 'Juan Pérez', cedula: '123456789' },
        { id: 2, nombre: 'María García', cedula: '987654321' },
      ]
      const mockPrescripciones = [
        {
          id: 1,
          id_adulto_mayor: 1,
          nombre_medicamento: 'Aspirina',
          indicaciones: 'Tomar después de comidas',
          ayunas: false,
          desayuno: true,
          media_manana: false,
          almuerzo: true,
          merienda_tarde: false,
          cena: false,
          acostarse: false,
        },
      ]

      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockQueryAdultos = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAdultos, error: null }),
      }

      const mockQueryPrescripciones = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockPrescripciones, error: null }),
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQueryAdultos)
        .mockReturnValueOnce(mockQueryPrescripciones)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.adultos).toEqual(mockAdultos)
      expect(data.prescripciones).toEqual(mockPrescripciones)
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
      expect(data.prescripciones).toEqual([])
    })

    it('debe manejar error de consulta de prescripciones', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockQueryAdultos = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      const mockQueryPrescripciones = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Prescription error'),
        }),
      }

      ;(supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockQueryAdultos)
        .mockReturnValueOnce(mockQueryPrescripciones)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
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

    it('debe retornar 400 si falta el id_adulto_mayor', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          nombre_medicamento: 'Aspirina',
        }),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Paciente inválido.')
    })

    it('debe retornar 400 si id_adulto_mayor no es un número válido', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          id_adulto_mayor: 'invalid',
          nombre_medicamento: 'Aspirina',
        }),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Paciente inválido.')
    })

    it('debe retornar 400 si falta el nombre del medicamento', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          id_adulto_mayor: 1,
          nombre_medicamento: '',
        }),
      } as unknown as Request

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('El nombre del medicamento es requerido.')
    })

    it('debe crear prescripción exitosamente', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      const mockPrescripcionData = {
        id_adulto_mayor: 1,
        nombre_medicamento: 'Aspirina',
        indicaciones: 'Tomar después de comidas',
        desayuno: true,
        almuerzo: true,
      }
      const mockCreatedPrescripcion = {
        id: 1,
        ...mockPrescripcionData,
        ayunas: false,
        media_manana: false,
        merienda_tarde: false,
        cena: false,
        acostarse: false,
      }

      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue(mockPrescripcionData),
      } as unknown as Request

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCreatedPrescripcion,
          error: null,
        }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.prescripcion).toEqual(mockCreatedPrescripcion)
    })

    it('debe establecer valores por defecto para horarios no especificados', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      const mockPrescripcionData = {
        id_adulto_mayor: 1,
        nombre_medicamento: 'Aspirina',
      }

      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue(mockPrescripcionData),
      } as unknown as Request

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 1, ...mockPrescripcionData },
          error: null,
        }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      await POST(mockRequest)

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ayunas: false,
          desayuno: false,
          media_manana: false,
          almuerzo: false,
          merienda_tarde: false,
          cena: false,
          acostarse: false,
        })
      )
    })

    it('debe normalizar espacios en nombre del medicamento', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          id_adulto_mayor: 1,
          nombre_medicamento: '  Aspirina  ',
        }),
      } as unknown as Request

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 1 },
          error: null,
        }),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery)

      await POST(mockRequest)

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre_medicamento: 'Aspirina',
        })
      )
    })

    it('debe manejar error de inserción', async () => {
      const mockSession = { userId: '1', role: 'admin' }
      ;(getSession as jest.Mock).mockResolvedValue(mockSession)

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          id_adulto_mayor: 1,
          nombre_medicamento: 'Aspirina',
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
      expect(data.message).toBe('Error al crear la prescripción.')
    })
  })
})
