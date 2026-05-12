import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    usuario: {
      id: session.id,
      username: session.username,
      nombre: session.nombre,
      rol: session.rol,
    },
  })
}
