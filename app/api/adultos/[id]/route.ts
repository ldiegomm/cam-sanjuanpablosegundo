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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Borrar prescripciones
    await supabaseAdmin
      .from('prescripciones')
      .delete()
      .eq('id_adulto_mayor', id)

    // 2. Borrar historial de salud
    await supabaseAdmin
      .from('historial_salud')
      .delete()
      .eq('id_adulto_mayor', id)

    // 3. Borrar paciente
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