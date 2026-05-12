import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface Usuario {
  id: string
  username: string
  nombre: string
  email: string | null
  rol: string
}

export interface AuthResult {
  success: boolean
  usuario?: Usuario
  message?: string
}

// ─────────────────────────────────────────────
// Usuario base (sin base de datos)
// Este usuario siempre estará disponible como
// administrador principal del sistema.
// ─────────────────────────────────────────────

const BASE_USERS: Array<{ username: string; password: string; usuario: Usuario }> = [
  {
    username: 'padillahw',
    password: 'admin',
    usuario: {
      id: 'base-0001',
      username: 'padillahw',
      nombre: 'Administrador',
      email: null,
      rol: 'admin',
    },
  },
]

// ─────────────────────────────────────────────
// Clase AuthService
// ─────────────────────────────────────────────

export class AuthService {
  /**
   * Autentica un usuario.
   *
   * Orden de verificación:
   *  1. Usuarios base hardcodeados (siempre disponibles).
   *  2. Usuarios en la tabla `usuarios` de Supabase.
   *
   * Los usuarios de Supabase deben tener:
   *   - columna `username` (string único)
   *   - columna `password_hash` (bcrypt)
   *   - columna `activo` (boolean)
   *   - columnas `id`, `nombre`, `email`, `rol`
   */
  static async authenticate(username: string, password: string): Promise<AuthResult> {
    if (!username || !password) {
      return { success: false, message: 'Usuario y contraseña son requeridos.' }
    }

    // 1. Verificar usuarios base
    const baseMatch = BASE_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    )
    if (baseMatch) {
      if (baseMatch.password === password) {
        return { success: true, usuario: baseMatch.usuario }
      }
      // El username coincide pero la contraseña no → no seguir buscando en BD
      return { success: false, message: 'Credenciales incorrectas.' }
    }

    // 2. Buscar en Supabase
    return await AuthService.authenticateFromDatabase(username, password)
  }

  /**
   * Busca al usuario en la tabla `usuarios` de Supabase y valida su contraseña.
   * Preparado para usarse en el futuro cuando se registren usuarios en la BD.
   */
  private static async authenticateFromDatabase(
    username: string,
    password: string
  ): Promise<AuthResult> {
    try {
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('id, username, nombre, email, rol, password_hash, activo')
        .eq('username', username)
        .eq('activo', true)
        .limit(1)

      if (error) {
        console.error('[AuthService] Error consultando Supabase:', error)
        return {
          success: false,
          message: 'Error en el sistema. Por favor contacte al administrador.',
        }
      }

      if (!usuarios || usuarios.length === 0) {
        return {
          success: false,
          message: 'Credenciales incorrectas. Por favor contacte al administrador del sistema.',
        }
      }

      const dbUser = usuarios[0]
      const passwordValida = await bcrypt.compare(password, dbUser.password_hash)

      if (!passwordValida) {
        return {
          success: false,
          message: 'Credenciales incorrectas. Por favor contacte al administrador del sistema.',
        }
      }

      // Actualizar último acceso (no bloqueante)
      supabase
        .from('usuarios')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', dbUser.id)
        .then(() => {})

      const { password_hash, activo, ...usuarioLimpio } = dbUser
      return { success: true, usuario: usuarioLimpio as Usuario }
    } catch (err) {
      console.error('[AuthService] Error inesperado:', err)
      return {
        success: false,
        message: 'Error en el sistema. Por favor contacte al administrador.',
      }
    }
  }

  /**
   * Busca un usuario por ID (base + Supabase).
   * Útil para validar sesiones activas.
   */
  static async getUsuarioById(id: string): Promise<Usuario | null> {
    // Verificar usuarios base
    const base = BASE_USERS.find((u) => u.usuario.id === id)
    if (base) return base.usuario

    // Buscar en Supabase
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, username, nombre, email, rol')
        .eq('id', id)
        .eq('activo', true)
        .single()

      if (error || !data) return null
      return data as Usuario
    } catch {
      return null
    }
  }
}
