import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

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
    const { data: usuarioActualizado } = await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('email', resetToken.email)
      .select('email, nombre')
      .single()

    // Marcar token como usado
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id)

    // Enviar correo de confirmación (no debe hacer fallar la respuesta si falla)
    try {
      const fechaHora = new Date().toLocaleString('es-CR', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/Costa_Rica'
      })

      await transporter.sendMail({
        from: `"Centro Adulto Mayor San Juan Pablo II" <${process.env.GMAIL_USER}>`,
        to: usuarioActualizado?.email ?? resetToken.email,
        subject: 'Tu contraseña fue cambiada',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
            <h2 style="font-size:18px;font-weight:500;margin-bottom:8px;">Tu contraseña fue cambiada</h2>
            <p style="font-size:14px;color:#888780;margin-bottom:1.5rem;">Hola${usuarioActualizado?.nombre ? ` ${usuarioActualizado.nombre}` : ''}, te confirmamos que tu contraseña fue cambiada exitosamente el ${fechaHora}.</p>
            <p style="font-size:12px;color:#888780;margin-top:1.5rem;">Si no realizaste este cambio, contactá al administrador del sistema de inmediato.</p>
          </div>
        `
      })
    } catch (error) {
      console.error('Error enviando correo de confirmación de cambio de contraseña:', error)
    }

    return NextResponse.json({ success: true, message: 'Contraseña actualizada exitosamente.' })

  } catch (error) {
    console.error('Error en reset-password:', error)
    return NextResponse.json({ success: false, message: 'Error en el sistema.' }, { status: 500 })
  }
}