import { normalizeUserRole, USER_ROLES } from './userRoles'

describe('userRoles', () => {
  describe('normalizeUserRole', () => {
    it('debe retornar "admin" para "admin" en minúsculas', () => {
      expect(normalizeUserRole('admin')).toBe('admin')
    })

    it('debe retornar "colaborador" para "colaborador" en minúsculas', () => {
      expect(normalizeUserRole('colaborador')).toBe('colaborador')
    })

    it('debe normalizar "ADMIN" a "admin"', () => {
      expect(normalizeUserRole('ADMIN')).toBe('admin')
    })

    it('debe normalizar "COLABORADOR" a "colaborador"', () => {
      expect(normalizeUserRole('COLABORADOR')).toBe('colaborador')
    })

    it('debe normalizar "Admin" a "admin"', () => {
      expect(normalizeUserRole('Admin')).toBe('admin')
    })

    it('debe normalizar "Colaborador" a "colaborador"', () => {
      expect(normalizeUserRole('Colaborador')).toBe('colaborador')
    })

    it('debe manejar espacios al inicio y final', () => {
      expect(normalizeUserRole('  admin  ')).toBe('admin')
      expect(normalizeUserRole('  colaborador  ')).toBe('colaborador')
    })

    it('debe retornar null para roles inválidos', () => {
      expect(normalizeUserRole('usuario')).toBeNull()
      expect(normalizeUserRole('guest')).toBeNull()
      expect(normalizeUserRole('superadmin')).toBeNull()
    })

    it('debe retornar null para string vacío', () => {
      expect(normalizeUserRole('')).toBeNull()
    })

    it('debe retornar null para string con solo espacios', () => {
      expect(normalizeUserRole('   ')).toBeNull()
    })

    it('debe retornar null para null', () => {
      expect(normalizeUserRole(null)).toBeNull()
    })

    it('debe retornar null para undefined', () => {
      expect(normalizeUserRole(undefined)).toBeNull()
    })
  })

  describe('USER_ROLES', () => {
    it('debe contener solo "admin" y "colaborador"', () => {
      expect(USER_ROLES).toEqual(['admin', 'colaborador'])
    })

    it('debe tener longitud 2', () => {
      expect(USER_ROLES).toHaveLength(2)
    })
  })
})
