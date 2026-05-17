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