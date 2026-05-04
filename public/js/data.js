/* ============================================================
   DATA - Datos de la aplicación (estructura de datos)
   ============================================================ */

// Datos de pacientes
export const pacientesDatos = {
  'María Rodríguez': {
    iniciales: 'MR',
    color: 'avatar-green',
    cedula: '3-042-1891',
    nacimiento: '1946-03-15',
    sexo: 'Femenino',
    estadoCivil: 'Casada',
    telefono: '8888-0001',
    pension: 'Sí',
    provincia: 'Cartago',
    canton: 'El Guarco',
    distrito: 'San Isidro',
    barrio: 'Los Ángeles',
    familiarNombre: 'Laura Rodríguez',
    familiarCedula: '3-112-0884',
    familiarTel: '8888-0002',
    emergenciaNombre: 'Carlos Rodríguez',
    emergenciaTel: '8888-0003'
  },
  'José Castro': {
    iniciales: 'JC',
    color: 'avatar-blue',
    cedula: '1-288-0442',
    nacimiento: '1942-07-22',
    sexo: 'Masculino',
    estadoCivil: 'Viudo',
    telefono: '8888-0004',
    pension: 'Sí',
    provincia: 'Cartago',
    canton: 'Cartago',
    distrito: 'Oriental',
    barrio: 'San Nicolás',
    familiarNombre: 'Pedro Castro',
    familiarCedula: '1-400-1122',
    familiarTel: '8888-0005',
    emergenciaNombre: 'Pedro Castro',
    emergenciaTel: '8888-0005'
  },
  'Ana Mora': {
    iniciales: 'AM',
    color: 'avatar-yellow',
    cedula: '2-120-3391',
    nacimiento: '1953-11-05',
    sexo: 'Femenino',
    estadoCivil: 'Soltera',
    telefono: '8888-0006',
    pension: 'No',
    provincia: 'Cartago',
    canton: 'El Guarco',
    distrito: 'Tejar',
    barrio: 'Centro',
    familiarNombre: 'Rosa Mora',
    familiarCedula: '2-300-4455',
    familiarTel: '8888-0007',
    emergenciaNombre: 'Rosa Mora',
    emergenciaTel: '8888-0007'
  }
};

// Opciones de pacientes para los buscadores
export const pacientesOpciones = [
  { key: 'maria', nombre: 'María Rodríguez' },
  { key: 'jose', nombre: 'José Castro' },
  { key: 'ana', nombre: 'Ana Mora' }
];

// Lista de personas para el dashboard
export const personasLista = [
  { key: 'maria', nombre: 'María Rodríguez' },
  { key: 'jose', nombre: 'José Castro' },
  { key: 'ana', nombre: 'Ana Mora' }
];

// Datos de historial por persona
export const historialDatos = {
  maria: {
    patologias: ['Hipertensión', 'Diabetes', 'Artritis'],
    lesiones: ['Rodilla', 'Columna lumbar'],
    operaciones: 'Rodilla derecha (2018)',
    habitos: 'No fuma · No consume licor<br>Ejercicio 3x semana',
    limitaciones: 'Dificultad para subir escaleras por problema en rodilla.',
    tieneData: true
  },
  jose: {
    patologias: ['Hipertensión'],
    lesiones: [],
    operaciones: 'Ninguna',
    habitos: 'No fuma · No consume licor<br>Ejercicio 2x semana',
    limitaciones: 'Ninguna',
    tieneData: true
  },
  ana: {
    patologias: ['Osteoporosis'],
    lesiones: ['Cadera'],
    operaciones: 'Ninguna',
    habitos: 'No fuma · No consume licor<br>Sin ejercicio regular',
    limitaciones: 'Dificultad para caminar distancias largas.',
    tieneData: true
  }
};

// Datos de medicamentos por persona
export const medsDatos = {
  maria: [
    {
      nombre: 'Metformina 500mg',
      indicacion: 'Sin indicación especial',
      horarios: [true, false, false, true, false, false, false]
    }
  ],
  jose: [
    {
      nombre: 'Enalapril 10mg',
      indicacion: 'Tomar con agua abundante',
      horarios: [false, true, false, false, false, false, true]
    }
  ],
  ana: [
    {
      nombre: 'Calcio 500mg',
      indicacion: 'Tomar con el desayuno',
      horarios: [false, true, false, false, false, false, false]
    }
  ]
};

// Keys de horarios
export const horarioKeys = ['ayunas', 'desayuno', 'mmañana', 'almuerzo', 'mtarde', 'cena', 'acostarse'];
