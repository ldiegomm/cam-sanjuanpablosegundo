import { 
  executeSupabaseQuery, 
  getFromTable, 
  insertIntoTable, 
  updateTable, 
  deleteFromTable 
} from './Acceso'
import { supabase } from '@/lib/supabase'

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}))

describe('Database Access Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('executeSupabaseQuery', () => {
    it('debe ejecutar una query exitosamente', async () => {
      const mockData = [{ id: 1, name: 'Test' }]
      ;(supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await executeSupabaseQuery('SELECT * FROM test')
      
      expect(supabase.rpc).toHaveBeenCalledWith('execute_sql', {
        query_text: 'SELECT * FROM test',
        query_params: [],
      })
      expect(result).toEqual(mockData)
    })

    it('debe pasar parámetros correctamente', async () => {
      const mockData = { id: 1 }
      ;(supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null,
      })

      await executeSupabaseQuery('SELECT * FROM test WHERE id = $1', [1])
      
      expect(supabase.rpc).toHaveBeenCalledWith('execute_sql', {
        query_text: 'SELECT * FROM test WHERE id = $1',
        query_params: [1],
      })
    })

    it('debe lanzar error cuando la query falla', async () => {
      const mockError = new Error('Database error')
      ;(supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      await expect(executeSupabaseQuery('SELECT * FROM test')).rejects.toThrow('Database error')
    })
  })

  describe('getFromTable', () => {
    it('debe obtener todos los registros sin opciones', async () => {
      const mockData = [{ id: 1 }, { id: 2 }]
      const mockSelect = jest.fn().mockResolvedValue({ data: mockData, error: null })
      const mockQuery = {
        select: mockSelect,
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      const result = await getFromTable('test_table')
      
      expect(supabase.from).toHaveBeenCalledWith('test_table')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result).toEqual(mockData)
    })

    it('debe aplicar filtros correctamente', async () => {
      const mockData = [{ id: 1, name: 'Test' }]
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockData, error: null }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      const result = await getFromTable('test_table', {
        filter: { id: 1, active: true },
      })
      
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('active', true)
      expect(result).toEqual(mockData)
    })

    it('debe aplicar orden correctamente', async () => {
      const mockData = [{ id: 1 }]
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockData, error: null }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      const result = await getFromTable('test_table', {
        order: { column: 'name', ascending: false },
      })
      
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: false })
      expect(result).toEqual(mockData)
    })

    it('debe aplicar límite correctamente', async () => {
      const mockData = [{ id: 1 }]
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: mockData, error: null }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      const result = await getFromTable('test_table', { limit: 10 })
      
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
      expect(result).toEqual(mockData)
    })

    it('debe lanzar error cuando falla la consulta', async () => {
      const mockError = new Error('Query failed')
      const mockSelect = jest.fn().mockResolvedValue({ data: null, error: mockError })
      const mockQuery = {
        select: mockSelect,
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      await expect(getFromTable('test_table')).rejects.toThrow('Query failed')
    })
  })

  describe('insertIntoTable', () => {
    it('debe insertar un registro único', async () => {
      const mockData = [{ id: 1, name: 'Test' }]
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      const result = await insertIntoTable('test_table', { name: 'Test' })
      
      expect(supabase.from).toHaveBeenCalledWith('test_table')
      expect(mockQuery.insert).toHaveBeenCalledWith({ name: 'Test' })
      expect(result).toEqual(mockData)
    })

    it('debe insertar múltiples registros', async () => {
      const mockData = [{ id: 1 }, { id: 2 }]
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      const dataToInsert = [{ name: 'Test1' }, { name: 'Test2' }]
      const result = await insertIntoTable('test_table', dataToInsert)
      
      expect(mockQuery.insert).toHaveBeenCalledWith(dataToInsert)
      expect(result).toEqual(mockData)
    })

    it('debe lanzar error cuando falla la inserción', async () => {
      const mockError = new Error('Insert failed')
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      await expect(insertIntoTable('test_table', { name: 'Test' })).rejects.toThrow('Insert failed')
    })
  })

  describe('updateTable', () => {
    it('debe actualizar registros con filtro', async () => {
      const mockData = [{ id: 1, name: 'Updated' }]
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      const result = await updateTable(
        'test_table',
        { name: 'Updated' },
        { id: 1 }
      )
      
      expect(supabase.from).toHaveBeenCalledWith('test_table')
      expect(mockQuery.update).toHaveBeenCalledWith({ name: 'Updated' })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(result).toEqual(mockData)
    })

    it('debe aplicar múltiples filtros', async () => {
      const mockData = [{ id: 1 }]
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      await updateTable(
        'test_table',
        { name: 'Updated' },
        { id: 1, active: true }
      )
      
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('active', true)
    })

    it('debe lanzar error cuando falla la actualización', async () => {
      const mockError = new Error('Update failed')
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      await expect(
        updateTable('test_table', { name: 'Updated' }, { id: 1 })
      ).rejects.toThrow('Update failed')
    })
  })

  describe('deleteFromTable', () => {
    it('debe eliminar registros con filtro', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: null }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      await deleteFromTable('test_table', { id: 1 })
      
      expect(supabase.from).toHaveBeenCalledWith('test_table')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
    })

    it('debe aplicar múltiples filtros', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: null, error: null }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      await deleteFromTable('test_table', { id: 1, active: false })
      
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
      expect(mockQuery.eq).toHaveBeenCalledWith('active', false)
    })

    it('debe lanzar error cuando falla la eliminación', async () => {
      const mockError = new Error('Delete failed')
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue(mockQuery)

      await expect(deleteFromTable('test_table', { id: 1 })).rejects.toThrow('Delete failed')
    })
  })
})
