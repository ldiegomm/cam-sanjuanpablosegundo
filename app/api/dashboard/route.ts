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

    const { data, error } = await supabaseAdmin
      .from('adultos_mayores')
      .select(`
        nombre,
        prescripciones (
          nombre_medicamento,
          ayunas,
          desayuno,
          media_manana,
          almuerzo,
          merienda_tarde,
          cena,
          acostarse
        )
      `)
      .order('nombre')

    if (error) throw error

    return NextResponse.json({ pacientes: data })

  } catch (error) {
    console.error('Error en dashboard:', error)
    return NextResponse.json({ pacientes: [] }, { status: 500 })
  }
}