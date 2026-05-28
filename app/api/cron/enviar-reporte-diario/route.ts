import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('========================================');
  console.log('CRON EJECUTADO - Inicio');
  console.log('SITIO_URL:', process.env.SITIO_URL);
  console.log('========================================');
  
  try {
    // 1. Seguridad: Verificar que la petición viene de Vercel Cron
    console.log('1. Verificando autorización...');
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader);
    console.log('Expected:', `Bearer ${process.env.CRON_SECRET}`);
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Autorización fallida');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ Autorización correcta');
    
    // 2. Validar que exista SITIO_URL
    console.log('2. Validando SITIO_URL...');
    if (!process.env.SITIO_URL) {
      console.log('❌ SITIO_URL no configurado');
      return NextResponse.json({ 
        error: 'SITIO_URL no está configurado' 
      }, { status: 500 });
    }
    console.log('✅ SITIO_URL configurado:', process.env.SITIO_URL);
    
    // 3. Obtener fecha de hoy
    console.log('3. Obteniendo fecha...');
    const hoy = new Date().toISOString().split('T')[0];
    console.log('Fecha:', hoy);
    
    // 4. Llamar al endpoint que envía el email
    console.log('4. Preparando fetch...');
    const baseUrl = process.env.SITIO_URL;
    const url = `${baseUrl}/api/emails/reporte-medicamentos`;
    console.log('URL completa:', url);
    
    console.log('5. Ejecutando fetch...');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: hoy })
    });
    
    console.log('6. Fetch completado');
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const responseText = await response.text();
    console.log('Response text:', responseText.substring(0, 200));

    let result;
    try {
    result = JSON.parse(responseText);
    } catch (e) {
    console.error('Error parsing JSON:', e);
    console.error('Response was:', responseText);
    return NextResponse.json({ 
        error: 'El endpoint devolvió contenido inválido',
        status: response.status,
        content: responseText.substring(0, 500)
    }, { status: 500 });
    }
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: result
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      fecha: hoy,
      result
    });
    
  } catch (error: unknown) {
    console.error('Error en cron job:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ 
      error: message 
    }, { status: 500 });
  }
}