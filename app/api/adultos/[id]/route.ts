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