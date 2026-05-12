import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    const result = await AuthService.authenticate(username, password)

    if (!result.success || !result.usuario) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      usuario: result.usuario,
    })

    // Cookie de sesión válida por 7 días
    response.cookies.set(
      'user_session',
      JSON.stringify({
        id: result.usuario.id,
        username: result.usuario.username,
        nombre: result.usuario.nombre,
        email: result.usuario.email,
        rol: result.usuario.rol,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
      }
    )

    return response
  } catch (error) {
    console.error('[/api/auth/login] Error inesperado:', error)
    return NextResponse.json(
      { success: false, message: 'Error en el sistema. Por favor contacte al administrador.' },
      { status: 500 }
    )
  }
}