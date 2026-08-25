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

export async function GET() {
  try {
    const auth = await requireAuth()

    if (auth.error) {
      return auth.error
    }

    const [{ data: adultos, error: eAdultos }, { data: prescripciones, error: ePrescripciones }] =
      await Promise.all([
        supabaseAdmin
          .from('adultos_mayores')
          .select('id, nombre, cedula')
          .order('nombre'),
        supabaseAdmin
          .from('prescripciones')
          .select('id, id_adulto_mayor, nombre_medicamento, indicaciones, ayunas, desayuno, media_manana, almuerzo, merienda_tarde, cena, acostarse, lunes, martes, miercoles, jueves, viernes, sabado, domingo')
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
    const auth = await requireAuth()

    if (auth.error) {
      return auth.error
    }

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
        lunes:         body.lunes         ?? true,
        martes:        body.martes        ?? true,
        miercoles:     body.miercoles     ?? true,
        jueves:        body.jueves        ?? true,
        viernes:       body.viernes       ?? true,
        sabado:        body.sabado        ?? true,
        domingo:       body.domingo       ?? true,
      })
      .select('id, id_adulto_mayor, nombre_medicamento, indicaciones, ayunas, desayuno, media_manana, almuerzo, merienda_tarde, cena, acostarse, lunes, martes, miercoles, jueves, viernes, sabado, domingo')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, prescripcion: data })

  } catch (error) {
    console.error('Error creando prescripción:', error)
    return NextResponse.json({ success: false, message: 'Error al crear la prescripción.' }, { status: 500 })
  }
}
