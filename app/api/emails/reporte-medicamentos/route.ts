import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase';
import { obtenerDiaSemanaCR, formatearFechaLarga } from '@/lib/fecha';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

type Prescripcion = {
  nombre_medicamento: string;
  dosis: string | null;
  indicaciones: string | null;
  ayunas: boolean;
  desayuno: boolean;
  media_manana: boolean;
  almuerzo: boolean;
  merienda_tarde: boolean;
  cena: boolean;
  acostarse: boolean;
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  domingo: boolean;
};

type PacienteRow = {
  nombre: string;
  cedula: string | null;
  prescripciones: Prescripcion[];
};

const MOMENTOS_DIA: { key: keyof Prescripcion; label: string }[] = [
  { key: 'ayunas', label: 'Ayunas' },
  { key: 'desayuno', label: 'Desayuno' },
  { key: 'media_manana', label: 'Media mañana' },
  { key: 'almuerzo', label: 'Almuerzo' },
  { key: 'merienda_tarde', label: 'Merienda de tarde' },
  { key: 'cena', label: 'Cena' },
  { key: 'acostarse', label: 'Antes de acostarse' },
];

function getMomentos(prescripcion: Prescripcion): string {
  return MOMENTOS_DIA
    .filter((momento) => prescripcion[momento.key])
    .map((momento) => momento.label)
    .join(', ');
}

function getNombreConDosis(prescripcion: Prescripcion): string {
  return `${prescripcion.nombre_medicamento}${prescripcion.dosis ? ` ${prescripcion.dosis}` : ''}`;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.EMAIL_NOTIFICACIONES) {
      console.warn('EMAIL_NOTIFICACIONES no configurado, se omite el envío del reporte de medicamentos');
      return NextResponse.json({
        success: true,
        message: 'EMAIL_NOTIFICACIONES no está configurado, se omite el envío del correo'
      });
    }

    const { fecha } = await request.json();

    // 1. Query de adultos mayores con sus prescripciones
    const { data: pacientes, error } = await supabaseAdmin
      .from('adultos_mayores')
      .select(`
        nombre,
        cedula,
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
      .order('nombre');

    if (error) {
      console.error('Error Supabase:', error);
      return NextResponse.json({
        error: error.message
      }, { status: 500 });
    }

    const diaSemana = obtenerDiaSemanaCR(fecha);

    const pacientesConMedicamentos = ((pacientes ?? []) as PacienteRow[])
      .map((paciente) => ({
        ...paciente,
        prescripciones: paciente.prescripciones.filter((p) => p[diaSemana]),
      }))
      .filter((paciente) => paciente.prescripciones.length > 0);

    if (pacientesConMedicamentos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay medicamentos programados para hoy'
      });
    }

    // 2. Generar HTML del email
    const fechaFormateada = formatearFechaLarga(fecha);

    let emailHTML = `
      <h1 style="color: #2563eb;">📋 Reporte de Medicamentos</h1>
      <p style="color: #1f2937; margin: 4px 0 0;">Buenos días,</p>
      <p style="color: #1f2937; margin: 4px 0 16px;">
        Este es el detalle de los medicamentos que corresponde administrar hoy, ${fechaFormateada}, en el Centro Adulto Mayor San Juan Pablo II.
      </p>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
    `;

    pacientesConMedicamentos.forEach((paciente) => {
      emailHTML += `
        <div style="margin-bottom: 30px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
          <h3 style="color: #1f2937; margin-top: 0;">${paciente.nombre}</h3>
          <p style="color: #6b7280; margin: 5px 0;">Cédula: ${paciente.cedula}</p>
          <ul style="list-style: none; padding: 0;">
      `;

      paciente.prescripciones.forEach((prescripcion) => {
        emailHTML += `
          <li style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px;">
            <strong style="color: #2563eb;">💊 ${getNombreConDosis(prescripcion)}</strong><br>
            <span style="color: #059669;">⏰ ${getMomentos(prescripcion)}</span><br>
            ${prescripcion.indicaciones ? `<em style="color: #9ca3af;">📝 ${prescripcion.indicaciones}</em>` : ''}
          </li>
        `;
      });

      emailHTML += `
          </ul>
        </div>
      `;
    });

    const totalMedicamentos = pacientesConMedicamentos.reduce(
      (total, paciente) => total + paciente.prescripciones.length,
      0
    );

    emailHTML += `
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280;"><strong>Total:</strong> ${pacientesConMedicamentos.length} adultos mayores con medicamentos programados para hoy</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 8px;">Esta es una notificación automática, no es necesario responderla.</p>
    `;

    // 3. Enviar email
    const info = await transporter.sendMail({
      from: `"Centro Adulto Mayor San Juan Pablo II" <${process.env.GMAIL_USER}>`,
      to: [process.env.EMAIL_NOTIFICACIONES],
      subject: `Reporte de Medicamentos - ${fechaFormateada}`,
      html: emailHTML
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      adultos: pacientesConMedicamentos.length,
      medicamentos: totalMedicamentos
    });

  } catch (error: unknown) {
    console.error('Error enviando email:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({
      error: message
    }, { status: 500 });
  }
}
