import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.nombre_medicamento?.trim()) {
      return NextResponse.json({ success: false, message: 'El nombre del medicamento es requerido.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('prescripciones')
      .update({
        nombre_medicamento: body.nombre_medicamento.trim(),
        indicaciones:       body.indicaciones?.trim() || null,
        ayunas:             body.ayunas        ?? false,
        desayuno:           body.desayuno      ?? false,
        media_manana:       body.media_manana  ?? false,
        almuerzo:           body.almuerzo      ?? false,
        merienda_tarde:     body.merienda_tarde ?? false,
        cena:               body.cena          ?? false,
        acostarse:          body.acostarse     ?? false,
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error actualizando prescripción:', error)
    return NextResponse.json({ success: false, message: 'Error al actualizar la prescripción.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('prescripciones')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error eliminando prescripción:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
