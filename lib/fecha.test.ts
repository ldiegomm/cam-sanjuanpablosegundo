import {
  obtenerFechaCR,
  obtenerDiaSemanaCR,
  obtenerDiaSemanaHoyCR,
  formatearFechaLarga,
  obtenerMomentoActualCR,
  formatearHoraCR,
  calcularEdad,
} from './fecha'

describe('lib/fecha', () => {
  describe('obtenerFechaCR', () => {
    it('debe devolver la fecha en formato YYYY-MM-DD según la zona horaria de Costa Rica', () => {
      // 2026-09-02T03:00:00Z son las 21:00 del 2026-09-01 en Costa Rica (UTC-6)
      const momento = new Date('2026-09-02T03:00:00Z')
      expect(obtenerFechaCR(momento)).toBe('2026-09-01')
    })
  })

  describe('obtenerDiaSemanaCR', () => {
    it('debe mapear correctamente cada día de la semana', () => {
      expect(obtenerDiaSemanaCR('2026-08-30')).toBe('domingo')
      expect(obtenerDiaSemanaCR('2026-08-31')).toBe('lunes')
      expect(obtenerDiaSemanaCR('2026-09-01')).toBe('martes')
      expect(obtenerDiaSemanaCR('2026-09-02')).toBe('miercoles')
      expect(obtenerDiaSemanaCR('2026-09-03')).toBe('jueves')
      expect(obtenerDiaSemanaCR('2026-09-04')).toBe('viernes')
      expect(obtenerDiaSemanaCR('2026-09-05')).toBe('sabado')
    })
  })

  describe('obtenerDiaSemanaHoyCR', () => {
    afterEach(() => {
      jest.useRealTimers()
    })

    it('debe devolver el día de la semana de hoy según Costa Rica', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-02T15:00:00Z'))
      expect(obtenerDiaSemanaHoyCR()).toBe('miercoles')
    })
  })

  describe('formatearFechaLarga', () => {
    it('debe formatear la fecha en español, con el día de la semana en minúscula', () => {
      expect(formatearFechaLarga('2026-09-02')).toBe('miércoles 2 de septiembre de 2026')
    })
  })

  describe('obtenerMomentoActualCR', () => {
    it('debe devolver "ayunas" a las 5:00 a.m.', () => {
      // 11:00 UTC = 5:00 a.m. en Costa Rica (UTC-6)
      expect(obtenerMomentoActualCR(new Date('2026-09-02T11:00:00Z'))).toBe('ayunas')
    })

    it('debe devolver "almuerzo" a las 11:30 a.m.', () => {
      expect(obtenerMomentoActualCR(new Date('2026-09-02T17:30:00Z'))).toBe('almuerzo')
    })

    it('debe devolver "acostarse" a las 8:00 p.m.', () => {
      expect(obtenerMomentoActualCR(new Date('2026-09-03T02:00:00Z'))).toBe('acostarse')
    })

    it('debe devolver null en la madrugada, antes de que empiece "ayunas"', () => {
      // 3:00 a.m. en Costa Rica: ya pasó la medianoche pero aún no son las 5 a.m.
      expect(obtenerMomentoActualCR(new Date('2026-09-02T09:00:00Z'))).toBeNull()
    })
  })

  describe('formatearHoraCR', () => {
    it('debe formatear la hora en formato corto de Costa Rica', () => {
      const resultado = formatearHoraCR(new Date('2026-09-02T16:32:00Z'))
      expect(resultado).toMatch(/10:32/)
    })
  })

  describe('calcularEdad', () => {
    it('debe calcular la edad cuando ya pasó el cumpleaños este año', () => {
      expect(calcularEdad('1953-11-08', '2026-09-02')).toBe(72)
    })

    it('debe calcular la edad cuando todavía no llega el cumpleaños este año', () => {
      expect(calcularEdad('1953-11-08', '2026-01-01')).toBe(72)
    })

    it('debe restar un año si el cumpleaños es más adelante en el mes actual', () => {
      expect(calcularEdad('1953-09-15', '2026-09-02')).toBe(72)
    })

    it('debe sumar la edad correcta el mismo día del cumpleaños', () => {
      expect(calcularEdad('1953-09-02', '2026-09-02')).toBe(73)
    })
  })
})
