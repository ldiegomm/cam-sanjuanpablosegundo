import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('adultos_mayores')
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .single()

    if (error) throw error

    return NextResponse.json({ adulto: data })

  } catch (error) {
    console.error('Error obteniendo adulto:', error)
    return NextResponse.json({ adulto: null }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { error } = await supabaseAdmin
      .from('adultos_mayores')
      .update({
        nombre:              body.nombre,
        cedula:              body.cedula,
        fecha_nacimiento:    body.fecha_nacimiento,
        sexo:                body.sexo,
        estado_civil:        body.estado_civil || null,
        telefono:            body.telefono || null,
        pension_ivm:         body.pension_ivm ?? false,
        provincia:           body.provincia || null,
        canton:              body.canton || null,
        distrito:            body.distrito || null,
        barrio:              body.barrio || null,
        familiar_nombre:     body.familiar_nombre || null,
        familiar_cedula:     body.familiar_cedula || null,
        familiar_telefono:   body.familiar_telefono || null,
        familiar_direccion:  body.familiar_direccion || null,
        emergencia_nombre:   body.emergencia_nombre || null,
        emergencia_telefono: body.emergencia_telefono || null,
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error actualizando adulto:', error)
    return NextResponse.json({ success: false, message: 'Error al actualizar el registro.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await supabaseAdmin
      .from('prescripciones')
      .delete()
      .eq('id_adulto_mayor', id)

    await supabaseAdmin
      .from('historial_salud')
      .delete()
      .eq('id_adulto_mayor', id)

    const { error } = await supabaseAdmin
      .from('adultos_mayores')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error eliminando adulto:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}