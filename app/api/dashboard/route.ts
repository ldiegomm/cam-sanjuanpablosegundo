import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
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
      .eq('activo', true)
      .eq('prescripciones.activo', true)
      .order('nombre')

    if (error) throw error

    return NextResponse.json({ pacientes: data })

  } catch (error) {
    console.error('Error en dashboard:', error)
    return NextResponse.json({ pacientes: [] }, { status: 500 })
  }
}