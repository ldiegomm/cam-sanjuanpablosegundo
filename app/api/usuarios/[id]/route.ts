import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeUserRole } from '@/lib/userRoles'

type UsuarioPayload = {
  nombre?: string
  apellidos?: string
  email?: string
  password?: string
  rol?: string
  activo?: boolean
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function requireAdmin() {
  const session = await getSession()

  if (!session) {
    return {
      error: NextResponse.json({ success: false, message: 'No autenticado.' }, { status: 401 })
    }
  }

  if (String(session.rol).toLowerCase() !== 'admin') {
    return {
      error: NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 403 })
    }
  }

  return { session }
}

function validateUsuarioPayload(body: UsuarioPayload) {
  const nombre = body.nombre?.trim()
  const apellidos = body.apellidos?.trim()
  const email = body.email?.trim()
  const rol = normalizeUserRole(body.rol)

  if (!nombre || !apellidos || !email || !rol) {
    return 'Nombre, apellidos, correo y rol son requeridos.'
  }

  if (body.password && body.password.trim().length > 0 && body.password.trim().length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }

  return null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()

    if (auth.error) {
      return auth.error
    }

    const { id } = await params
    const body = (await request.json()) as UsuarioPayload
    const validationError = validateUsuarioPayload(body)

    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 })
    }

    const email = normalizeEmail(body.email!)
    const rol = normalizeUserRole(body.rol)

    if (!rol) {
      return NextResponse.json(
        { success: false, message: 'El rol debe ser admin o colaborador.' },
        { status: 400 }
      )
    }

    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Ya existe otro usuario con ese correo.' },
        { status: 409 }
      )
    }

    const updateData: {
      nombre: string
      apellidos: string
      email: string
      rol: string
      activo: boolean
      password_hash?: string
    } = {
      nombre: body.nombre!.trim(),
      apellidos: body.apellidos!.trim(),
      email,
      rol,
      activo: body.activo ?? true
    }

    if (body.password && body.password.trim()) {
      updateData.password_hash = await bcrypt.hash(body.password.trim(), 10)
    }

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select('id, nombre, apellidos, email, rol, activo, ultimo_acceso')
      .single()

    if (error) {
      throw error
    }

    const response = NextResponse.json({ success: true, usuario: data })

    if (String(auth.session.id) === String(id)) {
      const cookieStore = await cookies()
      const currentCookie = cookieStore.get('user_session')

      if (currentCookie) {
        response.cookies.set('user_session', JSON.stringify({
          id: data.id,
          email: data.email,
          nombre: data.nombre,
          rol: data.rol
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7
        })
      }
    }

    return response
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    return NextResponse.json(
      { success: false, message: 'Error al actualizar el usuario.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()

    if (auth.error) {
      return auth.error
    }

    const { id } = await params

    if (auth.session.id === id) {
      return NextResponse.json(
        { success: false, message: 'No podés eliminar tu propio usuario.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return NextResponse.json(
      { success: false, message: 'Error al eliminar el usuario.' },
      { status: 500 }
    )
  }
}