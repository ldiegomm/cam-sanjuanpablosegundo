const ZONA_HORARIA_CR = 'America/Costa_Rica'

export type DiaSemana = 'domingo' | 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado'

const DIAS_SEMANA: DiaSemana[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

/** Devuelve la fecha actual (YYYY-MM-DD) según el calendario de Costa Rica, sin importar la zona horaria del servidor. */
export function obtenerFechaCR(momento: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_CR,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(momento)
}

/** Traduce una fecha YYYY-MM-DD al nombre de columna del día de la semana correspondiente en Costa Rica. */
export function obtenerDiaSemanaCR(fechaISO: string): DiaSemana {
  // Costa Rica es UTC-6 fijo (sin horario de verano), así que el offset se puede fijar directamente.
  const fecha = new Date(`${fechaISO}T12:00:00-06:00`)
  return DIAS_SEMANA[fecha.getUTCDay()]
}

/** Día de la semana de "hoy" según el calendario de Costa Rica. */
export function obtenerDiaSemanaHoyCR(): DiaSemana {
  return obtenerDiaSemanaCR(obtenerFechaCR())
}

/** Formatea una fecha YYYY-MM-DD como texto largo en español, por ejemplo "lunes 24 de agosto de 2026". */
export function formatearFechaLarga(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T12:00:00-06:00`)
  const formatter = new Intl.DateTimeFormat('es-CR', {
    timeZone: ZONA_HORARIA_CR,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const partes = Object.fromEntries(formatter.formatToParts(fecha).map(p => [p.type, p.value]))
  return `${partes.weekday} ${partes.day} de ${partes.month} de ${partes.year}`
}

export type MomentoDia = 'ayunas' | 'desayuno' | 'media_manana' | 'almuerzo' | 'merienda_tarde' | 'cena' | 'acostarse'

// Rangos horarios aproximados de cada momento (hora de Costa Rica, 24h). No vienen del horario real
// del centro, que no estaba disponible; se dedujeron de prácticas típicas de administración de
// medicamentos en residencias de adultos mayores: cena servida entre 4 y 6pm, dosis de "hora de
// dormir" (HS) alrededor de las 8pm, y tomas "antes de comida" (AC) de referencia hospitalaria en
// 6am, 11am y 4pm. Si no reflejan la rutina real del centro, ajustar estos números es el único
// cambio necesario.
const MOMENTOS_HORARIO: { momento: MomentoDia; horaInicio: number }[] = [
  { momento: 'ayunas', horaInicio: 5 },
  { momento: 'desayuno', horaInicio: 7 },
  { momento: 'media_manana', horaInicio: 9 },
  { momento: 'almuerzo', horaInicio: 11 },
  { momento: 'merienda_tarde', horaInicio: 14 },
  { momento: 'cena', horaInicio: 16 },
  { momento: 'acostarse', horaInicio: 19 },
]

/** Momento del día que corresponde ahora mismo en Costa Rica, según los rangos horarios aproximados de arriba. */
export function obtenerMomentoActualCR(momento: Date = new Date()): MomentoDia {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA_CR,
    hourCycle: 'h23',
    hour: 'numeric',
    minute: 'numeric',
  })
  const partes = Object.fromEntries(formatter.formatToParts(momento).map(p => [p.type, p.value]))
  const horaActual = Number(partes.hour) + Number(partes.minute) / 60

  // De madrugada, antes de que empiece "ayunas", todavía se considera parte de "acostarse" de la noche anterior.
  const actual = [...MOMENTOS_HORARIO].reverse().find(m => horaActual >= m.horaInicio)
  return (actual ?? MOMENTOS_HORARIO[MOMENTOS_HORARIO.length - 1]).momento
}

/** Hora actual en formato corto, por ejemplo "10:32 a. m.", según el reloj de Costa Rica. */
export function formatearHoraCR(momento: Date = new Date()): string {
  return new Intl.DateTimeFormat('es-CR', {
    timeZone: ZONA_HORARIA_CR,
    hour: 'numeric',
    minute: '2-digit',
  }).format(momento)
}

/** Edad en años a partir de una fecha de nacimiento YYYY-MM-DD, calculada contra "hoy" en Costa Rica. */
export function calcularEdad(fechaNacimiento: string, hoyISO: string = obtenerFechaCR()): number {
  const [anioNac, mesNac, diaNac] = fechaNacimiento.split('-').map(Number)
  const [anioHoy, mesHoy, diaHoy] = hoyISO.split('-').map(Number)

  let edad = anioHoy - anioNac
  const mesDiff = mesHoy - mesNac
  if (mesDiff < 0 || (mesDiff === 0 && diaHoy < diaNac)) edad--
  return edad
}
