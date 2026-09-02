import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ConfiguracionPayload = {
  activo?: boolean
  correo_destino?: string | null
  domingo?: boolean
  lunes?: boolean
  martes?: boolean
  miercoles?: boolean
  jueves?: boolean
  viernes?: boolean
  sabado?: boolean
}

const DIAS_SEMANA: (keyof ConfiguracionPayload)[] = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado'
]

async function requireAuth() {
  const session = await getSession()

  if (!session) {
    return {
      error: NextResponse.json({ success: false, message: 'No autenticado.' }, { status: 401 })
    }
  }

  return { session }
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

function validateConfiguracionPayload(body: ConfiguracionPayload) {
  if (typeof body.activo !== 'boolean') {
    return 'El campo activo es requerido y debe ser verdadero o falso.'
  }

  for (const dia of DIAS_SEMANA) {
    if (typeof body[dia] !== 'boolean') {
      return `El campo ${dia} es requerido y debe ser verdadero o falso.`
    }
  }

  if (body.correo_destino && !EMAIL_REGEX.test(body.correo_destino.trim())) {
    return 'El correo destino no es válido.'
  }

  return null
}

export async function GET() {
  try {
    const auth = await requireAuth()

    if (auth.error) {
      return auth.error
    }

    const { data, error } = await supabaseAdmin
      .from('configuracion_notificaciones')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, configuracion: data })
  } catch (error) {
    console.error('Error obteniendo configuración de notificaciones:', error)
    return NextResponse.json(
      { success: false, message: 'Error al obtener la configuración de notificaciones.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin()

    if (auth.error) {
      return auth.error
    }

    const body = (await request.json()) as ConfiguracionPayload
    const validationError = validateConfiguracionPayload(body)

    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 })
    }

    const correoDestino = body.correo_destino?.trim() || null

    const { data, error } = await supabaseAdmin
      .from('configuracion_notificaciones')
      .update({
        activo: body.activo,
        correo_destino: correoDestino,
        domingo: body.domingo,
        lunes: body.lunes,
        martes: body.martes,
        miercoles: body.miercoles,
        jueves: body.jueves,
        viernes: body.viernes,
        sabado: body.sabado,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, configuracion: data })
  } catch (error) {
    console.error('Error actualizando configuración de notificaciones:', error)
    return NextResponse.json(
      { success: false, message: 'Error al actualizar la configuración de notificaciones.' },
      { status: 500 }
    )
  }
}
