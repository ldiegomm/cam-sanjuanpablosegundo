import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que NO requieren autenticación
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas y archivos estáticos
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (isPublic) {
    return NextResponse.next()
  }

  // Verificar cookie de sesión
  const session = request.cookies.get('user_session')

  if (!session?.value) {
    // No autenticado → redirigir al login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Validar que la cookie tenga la estructura esperada
  try {
    const parsed = JSON.parse(session.value)
    if (!parsed?.id || !parsed?.username) {
      throw new Error('Sesión inválida')
    }
  } catch {
    // Cookie corrupta → borrarla y redirigir al login
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('user_session')
    return response
  }

  return NextResponse.next()
}

export const config = {
  // Aplica el middleware a todas las rutas excepto archivos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
