import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ success: false, message: 'Datos incompletos.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
    }

    // Buscar token válido
    const { data: tokens } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .limit(1)

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ success: false, message: 'El link no es válido o ya fue utilizado.' }, { status: 400 })
    }

    const resetToken = tokens[0]

    // Verificar que no expiró
    if (new Date() > new Date(resetToken.expires_at)) {
      return NextResponse.json({ success: false, message: 'El link expiró. Solicitá uno nuevo.' }, { status: 400 })
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // Actualizar contraseña
    await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('email', resetToken.email)

    // Marcar token como usado
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id)

    return NextResponse.json({ success: true, message: 'Contraseña actualizada exitosamente.' })

  } catch (error) {
    console.error('Error en reset-password:', error)
    return NextResponse.json({ success: false, message: 'Error en el sistema.' }, { status: 500 })
  }
}