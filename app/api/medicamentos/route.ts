import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const [{ data: adultos, error: eAdultos }, { data: prescripciones, error: ePrescripciones }] =
      await Promise.all([
        supabaseAdmin
          .from('adultos_mayores')
          .select('id, nombre, cedula')
          .eq('activo', true)
          .order('nombre'),
        supabaseAdmin
          .from('prescripciones')
          .select('id, id_adulto_mayor, nombre_medicamento, indicaciones, ayunas, desayuno, media_manana, almuerzo, merienda_tarde, cena, acostarse')
          .order('id'),
      ])

    if (eAdultos) throw eAdultos
    if (ePrescripciones) throw ePrescripciones

    return NextResponse.json({ adultos, prescripciones })

  } catch (error) {
    console.error('Error obteniendo medicamentos:', error)
    return NextResponse.json({ adultos: [], prescripciones: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { id_adulto_mayor } = body
    if (!id_adulto_mayor || !Number.isFinite(Number(id_adulto_mayor))) {
      return NextResponse.json({ success: false, message: 'Paciente inválido.' }, { status: 400 })
    }
    if (!body.nombre_medicamento?.trim()) {
      return NextResponse.json({ success: false, message: 'El nombre del medicamento es requerido.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('prescripciones')
      .insert({
        id_adulto_mayor: Number(id_adulto_mayor),
        nombre_medicamento: body.nombre_medicamento.trim(),
        indicaciones: body.indicaciones?.trim() || null,
        ayunas:        body.ayunas        ?? false,
        desayuno:      body.desayuno      ?? false,
        media_manana:  body.media_manana  ?? false,
        almuerzo:      body.almuerzo      ?? false,
        merienda_tarde: body.merienda_tarde ?? false,
        cena:          body.cena          ?? false,
        acostarse:     body.acostarse     ?? false,
      })
      .select('id, id_adulto_mayor, nombre_medicamento, indicaciones, ayunas, desayuno, media_manana, almuerzo, merienda_tarde, cena, acostarse')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, prescripcion: data })

  } catch (error) {
    console.error('Error creando prescripción:', error)
    return NextResponse.json({ success: false, message: 'Error al crear la prescripción.' }, { status: 500 })
  }
}
