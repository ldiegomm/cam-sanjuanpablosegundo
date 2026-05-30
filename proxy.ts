import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rutasPublicas = ['/login', '/forgot-password', '/reset-password']

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('user_session')

  const esPublica = rutasPublicas.some(ruta => pathname.startsWith(ruta))

  // Si no tiene sesión y la ruta es privada → redirigir al login
  if (!session && !esPublica) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si tiene sesión y va al login → redirigir al home
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
}