import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { obtenerDiaSemanaHoyCR } from '@/lib/fecha'

type Prescripcion = {
  nombre_medicamento: string
  dosis: string | null
  indicaciones: string | null
  ayunas: boolean
  desayuno: boolean
  media_manana: boolean
  almuerzo: boolean
  merienda_tarde: boolean
  cena: boolean
  acostarse: boolean
  lunes: boolean
  martes: boolean
  miercoles: boolean
  jueves: boolean
  viernes: boolean
  sabado: boolean
  domingo: boolean
}

type Paciente = {
  nombre: string
  prescripciones: Prescripcion[]
}

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

    const { data, error } = await supabaseAdmin
      .from('adultos_mayores')
      .select(`
        nombre,
        prescripciones (
          nombre_medicamento,
          dosis,
          indicaciones,
          ayunas,
          desayuno,
          media_manana,
          almuerzo,
          merienda_tarde,
          cena,
          acostarse,
          lunes,
          martes,
          miercoles,
          jueves,
          viernes,
          sabado,
          domingo
        )
      `)
      .order('nombre')

    if (error) throw error

    const diaSemana = obtenerDiaSemanaHoyCR()

    const pacientes = ((data ?? []) as Paciente[]).map((paciente) => ({
      nombre: paciente.nombre,
      prescripciones: paciente.prescripciones.filter((p) => p[diaSemana]),
    }))

    return NextResponse.json({ pacientes })

  } catch (error) {
    console.error('Error en dashboard:', error)
    return NextResponse.json({ pacientes: [] }, { status: 500 })
  }
}