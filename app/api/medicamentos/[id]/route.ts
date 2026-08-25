import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function requireAuth() {
  const session = await getSession()

  if (!session) {
    return {
      error: NextResponse.json({ success: false, message: 'No autenticado.' }, { status: 401 })
    }
  }

  return { session }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()

    if (auth.error) {
      return auth.error
    }

    const { id } = await params
    const body = await request.json()

    if (!body.nombre_medicamento?.trim()) {
      return NextResponse.json({ success: false, message: 'El nombre del medicamento es requerido.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('prescripciones')
      .update({
        nombre_medicamento: body.nombre_medicamento.trim(),
        dosis:              body.dosis?.trim() || null,
        indicaciones:       body.indicaciones?.trim() || null,
        ayunas:             body.ayunas        ?? false,
        desayuno:           body.desayuno      ?? false,
        media_manana:       body.media_manana  ?? false,
        almuerzo:           body.almuerzo      ?? false,
        merienda_tarde:     body.merienda_tarde ?? false,
        cena:               body.cena          ?? false,
        acostarse:          body.acostarse     ?? false,
        lunes:              body.lunes         ?? true,
        martes:             body.martes        ?? true,
        miercoles:          body.miercoles     ?? true,
        jueves:             body.jueves        ?? true,
        viernes:            body.viernes       ?? true,
        sabado:             body.sabado        ?? true,
        domingo:            body.domingo       ?? true,
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
    const auth = await requireAuth()

    if (auth.error) {
      return auth.error
    }

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
