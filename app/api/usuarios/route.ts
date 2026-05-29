import { NextResponse } from 'next/server'
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
  const password = body.password?.trim()
  const rol = normalizeUserRole(body.rol)

  if (!nombre || !apellidos || !email || !password || !rol) {
    return 'Nombre, apellidos, correo, contraseña y rol son requeridos.'
  }

  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }

  return null
}

export async function GET() {
  try {
    const auth = await requireAdmin()

    if (auth.error) {
      return auth.error
    }

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, apellidos, email, rol, activo, ultimo_acceso')
      .order('nombre')

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, usuarios: data ?? [] })
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    return NextResponse.json(
      { success: false, usuarios: [], message: 'Error al obtener los usuarios.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()

    if (auth.error) {
      return auth.error
    }

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

    const passwordHash = await bcrypt.hash(body.password!.trim(), 10)

    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Ya existe un usuario con ese correo.' },
        { status: 409 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .insert({
        nombre: body.nombre!.trim(),
        apellidos: body.apellidos!.trim(),
        email,
        rol,
        activo: body.activo ?? true,
        password_hash: passwordHash
      })
      .select('id, nombre, apellidos, email, rol, activo, ultimo_acceso')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, usuario: data })
  } catch (error) {
    console.error('Error creando usuario:', error)
    return NextResponse.json(
      { success: false, message: 'Error al crear el usuario.' },
      { status: 500 }
    )
  }
}