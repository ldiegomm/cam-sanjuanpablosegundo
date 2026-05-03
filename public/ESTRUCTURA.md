# Estructura del Proyecto - Centro Adulto Mayor San Juan Pablo II

Este proyecto ha sido modularizado para una mejor organización y mantenibilidad del código.

## 📁 Estructura de Carpetas

```
public/
├── css/                    # Estilos modulares
│   ├── base.css           # Estilos base y reseteos
│   ├── login.css          # Estilos de la pantalla de login
│   ├── layout.css         # Estructura principal (sidebar, main, nav)
│   ├── components.css     # Componentes reutilizables (cards, badges, buttons, etc.)
│   ├── utilities.css      # Clases de utilidad (grids, spacing, etc.)
│   ├── modals.css         # Estilos de modales
│   └── responsive.css     # Media queries para diseño adaptativo
│
├── js/                     # JavaScript modular
│   ├── data.js            # Estructura de datos de la aplicación
│   ├── utils.js           # Funciones utilitarias
│   ├── navigation.js      # Gestión de navegación entre páginas
│   ├── auth.js            # Autenticación (login/logout)
│   ├── buscador.js        # Componente de buscador reutilizable
│   ├── modals.js          # Gestión de modales
│   ├── pacientes.js       # Gestión de pacientes
│   ├── historial.js       # Gestión de historial de salud
│   ├── medicamentos.js    # Gestión de medicamentos
│   ├── dashboard.js       # Panel de inicio
│   └── main.js            # Inicialización de la aplicación
│
├── index.html             # HTML principal modularizado
└── prototipo.html         # Archivo original (mantener como respaldo)
```

## 🎨 Organización del CSS

### base.css
- Reseteos globales
- Estilos base del body
- Tipografía base
- Inputs y formularios base

### login.css
- Pantalla de inicio de sesión
- Tarjeta de login
- Logo y branding
- Mensajes de error

### layout.css
- Estructura de la aplicación (.app)
- Sidebar y navegación
- Área de contenido principal
- Footer del sidebar

### components.css
- Cards y tarjetas
- Métricas
- Botones
- Badges y etiquetas
- Person items
- Tablas
- Toast notifications
- Buscador de pacientes

### utilities.css
- Sistema de grids
- Clases de spacing (mb-1, mb-2, mt-1)
- Layouts (row, row-between)
- Clases de texto (muted, section-label)
- Tags

### modals.css
- Overlays de modales
- Estilos de los diferentes modales
- Animaciones

### responsive.css
- Media queries para pantallas pequeñas
- Adaptación del sidebar a barra inferior
- Ajustes de grids para móvil
- Optimizaciones táctiles

## 📦 Organización del JavaScript

Todos los módulos utilizan **ES6 Modules** con import/export.

### data.js
Contiene todas las estructuras de datos:
- `pacientesDatos`: Información de pacientes
- `pacientesOpciones`: Opciones para buscadores
- `personasLista`: Lista para el dashboard
- `historialDatos`: Historiales de salud
- `medsDatos`: Medicamentos por persona
- `horarioKeys`: Claves de horarios

### utils.js
Funciones utilitarias generales:
- `showToast()`: Muestra notificaciones
- `updateCounter()`: Actualiza contador de pacientes
- `calcEdad()`: Calcula edad
- `initFecha()`: Inicializa fecha en dashboard

### navigation.js
Gestión de navegación:
- `showPage()`: Muestra una página
- `setActiveNav()`: Marca navegación activa
- `initNavigation()`: Inicializa listeners
- `checkMobile()`: Detecta y ajusta vista móvil

### auth.js
Autenticación:
- `initAuth()`: Inicializa listeners de login/logout
- Manejo de sesiones
- Validación de credenciales

### buscador.js
Componente reutilizable:
- `crearBuscador()`: Crea un buscador de pacientes
- `agregarPacienteOpciones()`: Agrega nuevas opciones
- Sistema de filtrado y selección

### modals.js
Gestión de modales:
- `showEliminarModal()`: Modal de confirmación de eliminación
- `checkUnsaved()`: Verifica cambios sin guardar
- `setUnsaved()`: Establece estado de cambios
- `initModals()`: Inicializa listeners
- `initUnsavedDetection()`: Detecta cambios en formularios

### pacientes.js
Gestión completa de pacientes:
- `cargarPerfil()`: Carga datos de un paciente
- `initPacientes()`: Inicializa listeners
- Crear, editar, eliminar pacientes
- Vista de perfil y edición

### historial.js
Gestión de historiales médicos:
- `renderHistorial()`: Renderiza historial
- `initHistorial()`: Inicializa listeners
- `irAHistorialPaciente()`: Navegación rápida
- Edición de patologías, lesiones, hábitos

### medicamentos.js
Gestión de medicamentos:
- `renderMeds()`: Renderiza medicamentos
- `initMedicamentos()`: Inicializa listeners
- `irAMedicamentosPaciente()`: Navegación rápida
- CRUD de medicamentos
- Horarios de toma

### dashboard.js
Panel de inicio:
- `renderDashboard()`: Renderiza horarios del día
- `renderBadgesPacientes()`: Muestra badges de estado
- Métricas y estadísticas

### main.js
Punto de entrada principal:
- Importa todos los módulos
- Inicializa la aplicación
- Coordina la comunicación entre módulos
- Expone funciones globales necesarias

## 🚀 Ventajas de la Modularización

1. **Mantenibilidad**: Cada archivo tiene una responsabilidad clara
2. **Escalabilidad**: Fácil agregar nuevas funcionalidades
3. **Reutilización**: Componentes como el buscador son reutilizables
4. **Debugging**: Más fácil localizar y corregir errores
5. **Colaboración**: Múltiples desarrolladores pueden trabajar sin conflictos
6. **Performance**: Carga modular y optimizable
7. **Organización**: Código limpio y bien estructurado

## 📝 Notas Importantes

- El archivo original `prototipo.html` se mantiene como respaldo
- El nuevo archivo principal es `index.html`
- Todos los módulos JS usan ES6 imports/exports
- Los estilos CSS están organizados por funcionalidad
- La aplicación es completamente responsive
- Incluye detección de cambios sin guardar
- Sistema de notificaciones toast
- Buscadores inteligentes con filtrado

## 🔧 Desarrollo Futuro

Esta estructura facilita:
- Agregar nuevas páginas/módulos
- Implementar tests unitarios
- Integrar con APIs backend
- Usar bundlers como Webpack/Vite
- Implementar TypeScript
- Agregar linting y formateo
