import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('adultos_mayores')
      .select(`
        id, nombre, cedula, fecha_nacimiento, sexo,
        prescripciones (id),
        historial_salud (id)
      `)
      .eq('activo', true)
      .order('nombre')

    if (error) throw error

    return NextResponse.json({ adultos: data })

  } catch (error) {
    console.error('Error obteniendo adultos:', error)
    return NextResponse.json({ adultos: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('adultos_mayores')
      .insert([{
        nombre:               body.nombre,
        cedula:               body.cedula,
        fecha_nacimiento:     body.fecha_nacimiento,
        sexo:                 body.sexo,
        estado_civil:         body.estado_civil || null,
        telefono:             body.telefono || null,
        pension_ivm:          body.pension_ivm ?? false,
        provincia:            body.provincia || null,
        canton:               body.canton || null,
        distrito:             body.distrito || null,
        barrio:               body.barrio || null,
        familiar_nombre:      body.familiar_nombre || null,
        familiar_cedula:      body.familiar_cedula || null,
        familiar_telefono:    body.familiar_telefono || null,
        familiar_direccion:   body.familiar_direccion || null,
        emergencia_nombre:    body.emergencia_nombre || null,
        emergencia_telefono:  body.emergencia_telefono || null,
        activo:               true
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, adulto: data })

  } catch (error) {
    console.error('Error creando adulto:', error)
    return NextResponse.json({ success: false, message: 'Error al guardar el registro.' }, { status: 500 })
  }
}