import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email y contraseña son requeridos'
      }, { status: 400 })
    }

    const { data: usuarios, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('activo', true)
      .limit(1)

    if (error) {
      console.error('Error buscando usuario:', error)
      return NextResponse.json({
        success: false,
        message: 'Error en el sistema. Por favor contacte al administrador.'
      }, { status: 500 })
    }

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Credenciales incorrectas. Por favor contacte al administrador del sistema.'
      }, { status: 401 })
    }

    const usuario = usuarios[0]

    const passwordValida = await bcrypt.compare(password, usuario.password_hash)

    if (!passwordValida) {
      return NextResponse.json({
        success: false,
        message: 'Credenciales incorrectas. Por favor contacte al administrador del sistema.'
      }, { status: 401 })
    }

    await supabaseAdmin
      .from('usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', usuario.id)

    const usuarioSinPassword = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      activo: usuario.activo,
      ultimo_acceso: usuario.ultimo_acceso
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      usuario: usuarioSinPassword
    })

    response.cookies.set('user_session', JSON.stringify({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })

    return response

  } catch (error: unknown) {
    console.error('Error en login:', error)
    return NextResponse.json({
      success: false,
      message: 'Error en el sistema. Por favor contacte al administrador.'
    }, { status: 500 })
  }
}