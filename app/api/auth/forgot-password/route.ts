import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, message: 'El correo es requerido.' }, { status: 400 })
    }

    // Verificar que el usuario existe
    const { data: usuarios } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nombre')
      .eq('email', email)
      .eq('activo', true)
      .limit(1)

    // Siempre responder igual para no revelar si el correo existe
    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({ success: true })
    }

    const usuario = usuarios[0]

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Invalidar tokens anteriores del mismo email
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false)

    // Guardar nuevo token
    await supabaseAdmin
      .from('password_reset_tokens')
      .insert({ email, token, expires_at: expiresAt.toISOString() })

    // Enviar email
    const resetUrl = `${process.env.SITIO_URL}/reset-password?token=${token}`

    try {
      await transporter.sendMail({
        from: `"Centro Adulto Mayor San Juan Pablo II" <${process.env.GMAIL_USER}>`,
        to: usuario.email,
        subject: 'Recuperación de contraseña',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
            <h2 style="font-size:18px;font-weight:500;margin-bottom:8px;">Recuperación de contraseña</h2>
            <p style="font-size:14px;color:#888780;margin-bottom:1.5rem;">Hola ${usuario.nombre}, recibimos una solicitud para restablecer tu contraseña.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#14B8A6;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
              Restablecer contraseña
            </a>
            <p style="font-size:12px;color:#888780;margin-top:1.5rem;">Este link es válido por 1 hora. Si no solicitaste esto, ignorá este mensaje.</p>
          </div>
        `
      })
    } catch (error) {
      console.error('Error enviando correo:', error)
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error en forgot-password:', error)
    return NextResponse.json({ success: false, message: 'Error en el sistema.' }, { status: 500 })
  }
}