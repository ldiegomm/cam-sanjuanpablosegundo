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

/** Edad en años a partir de una fecha de nacimiento YYYY-MM-DD, calculada contra "hoy" en Costa Rica. */
export function calcularEdad(fechaNacimiento: string, hoyISO: string = obtenerFechaCR()): number {
  const [anioNac, mesNac, diaNac] = fechaNacimiento.split('-').map(Number)
  const [anioHoy, mesHoy, diaHoy] = hoyISO.split('-').map(Number)

  let edad = anioHoy - anioNac
  const mesDiff = mesHoy - mesNac
  if (mesDiff < 0 || (mesDiff === 0 && diaHoy < diaNac)) edad--
  return edad
}
