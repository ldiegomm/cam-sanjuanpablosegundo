# Documentación de Pruebas Unitarias

## Configuración de Pruebas

Este proyecto utiliza **Jest** y **React Testing Library** para las pruebas unitarias.

### Dependencias Instaladas

- `jest` - Framework de pruebas
- `@testing-library/react` - Utilidades para probar componentes React
- `@testing-library/jest-dom` - Matchers personalizados para Jest
- `@testing-library/user-event` - Simulación de eventos de usuario
- `ts-jest` - Soporte de TypeScript para Jest
- `jest-environment-jsdom` - Entorno DOM para pruebas de componentes

## Estructura de Archivos de Prueba

Las pruebas se encuentran junto a sus archivos correspondientes:

```
proyecto/
├── app/
│   ├── (main)/
│   │   └── components/
│   │       ├── ErrorState.tsx
│   │       ├── ErrorState.test.tsx         # ✅ Pruebas del componente
│   │       ├── useEscapeKey.ts
│   │       └── useEscapeKey.test.ts        # ✅ Pruebas del hook
│   └── api/
│       ├── adultos/
│       │   ├── route.ts
│       │   └── route.test.ts               # ✅ Pruebas de API
│       ├── auth/
│       │   └── login/
│       │       ├── route.ts
│       │       └── route.test.ts           # ✅ Pruebas de autenticación
│       └── medicamentos/
│           ├── route.ts
│           └── route.test.ts               # ✅ Pruebas de API
├── lib/
│   ├── auth.ts
│   ├── auth.test.ts                        # ✅ Pruebas de utilidades de auth
│   ├── userRoles.ts
│   └── userRoles.test.ts                   # ✅ Pruebas de roles
├── BD/
│   ├── Acceso.ts
│   └── Acceso.test.ts                      # ✅ Pruebas de acceso a BD
├── jest.config.ts                          # Configuración de Jest
└── jest.setup.ts                           # Setup inicial de Jest
```

## Comandos de Pruebas

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas en modo watch (para desarrollo)
```bash
npm run test:watch
```

### Generar reporte de cobertura
```bash
npm run test:coverage
```

## Resumen de Pruebas Creadas

### 1. Componentes de UI

#### ErrorState.test.tsx
- ✅ Renderizado del título
- ✅ Icono por defecto y personalizado
- ✅ Descripción opcional
- ✅ Botón de acción y callback
- ✅ Validación de estilos

#### useEscapeKey.test.ts
- ✅ Detección de tecla Escape
- ✅ Activación/desactivación del hook
- ✅ Limpieza de event listeners
- ✅ Actualización de callbacks

### 2. Utilidades y Helpers

#### auth.test.ts
- ✅ `getSession()` - Obtención de sesión desde cookies
- ✅ `requireAuth()` - Validación de autenticación
- ✅ Manejo de JSON inválido
- ✅ Manejo de cookies faltantes

#### userRoles.test.ts
- ✅ `normalizeUserRole()` - Normalización de roles
- ✅ Manejo de mayúsculas/minúsculas
- ✅ Trim de espacios
- ✅ Validación de roles inválidos
- ✅ Manejo de valores null/undefined

### 3. Acceso a Base de Datos (BD/Acceso.test.ts)

- ✅ `executeSupabaseQuery()` - Ejecución de queries
- ✅ `getFromTable()` - Consultas con filtros, orden y límite
- ✅ `insertIntoTable()` - Inserción de registros
- ✅ `updateTable()` - Actualización de registros
- ✅ `deleteFromTable()` - Eliminación de registros
- ✅ Manejo de errores en todas las operaciones

### 4. Rutas API

#### api/adultos/route.test.ts
- ✅ GET: Listado de adultos mayores con historial
- ✅ GET: Validación de autenticación
- ✅ GET: Agrupación de historial por adulto
- ✅ POST: Creación de adultos mayores
- ✅ POST: Validación de campos obligatorios
- ✅ POST: Manejo de campos opcionales

#### api/auth/login/route.test.ts
- ✅ Validación de email y contraseña requeridos
- ✅ Autenticación exitosa
- ✅ Validación de credenciales incorrectas
- ✅ Actualización de último acceso
- ✅ Establecimiento de cookie de sesión
- ✅ Manejo de errores de base de datos

#### api/medicamentos/route.test.ts
- ✅ GET: Listado de adultos y prescripciones
- ✅ GET: Validación de autenticación
- ✅ POST: Creación de prescripciones
- ✅ POST: Validación de paciente válido
- ✅ POST: Validación de nombre de medicamento
- ✅ POST: Valores por defecto para horarios
- ✅ POST: Normalización de espacios

## Cobertura de Pruebas

Las pruebas cubren:

- **Componentes React**: Renderizado, props, eventos, hooks
- **Rutas API**: Autenticación, validación, CRUD operations
- **Utilidades**: Funciones de autenticación, normalización de roles
- **Acceso a Datos**: Operaciones CRUD con Supabase

## Mocks y Simulaciones

### Mocks Globales (jest.setup.ts)

- `next/navigation` - Router, searchParams, pathname
- `next/headers` - Cookies y headers
- Variables de entorno de Supabase

### Mocks Específicos por Prueba

- `@/lib/supabase` - Cliente de Supabase
- `bcryptjs` - Comparación de contraseñas
- `@/lib/auth` - Sesiones de usuario

## Buenas Prácticas Implementadas

1. **Aislamiento**: Cada prueba es independiente y no afecta a otras
2. **Cleanup**: `beforeEach` limpia todos los mocks
3. **Descriptivos**: Nombres de pruebas claros y específicos
4. **Cobertura**: Casos de éxito y error
5. **Realistas**: Simulan el comportamiento real de la aplicación

## Ejecución de Pruebas en CI/CD

Para integrar las pruebas en un pipeline de CI/CD:

```yaml
# Ejemplo para GitHub Actions
- name: Run tests
  run: npm test -- --ci --coverage --maxWorkers=2

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Agregar Nuevas Pruebas

Para agregar pruebas a un nuevo archivo:

1. Crear archivo con extensión `.test.ts` o `.test.tsx`
2. Importar las dependencias necesarias
3. Mockear las dependencias externas
4. Escribir las pruebas usando `describe()` e `it()`
5. Usar `expect()` para hacer aserciones

Ejemplo:

```typescript
import { myFunction } from './myFile'

describe('myFunction', () => {
  it('debe hacer algo específico', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })
})
```

## Solución de Problemas

### Error: Cannot find module
Asegúrate de que los paths en `jest.config.ts` coincidan con `tsconfig.json`:
```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Errores de importación de Next.js
Verifica que los mocks estén correctamente configurados en `jest.setup.ts`.

### Timeout en pruebas
Aumenta el timeout si las pruebas involucran operaciones asíncronas:
```typescript
jest.setTimeout(10000) // 10 segundos
```

## Recursos Adicionales

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Next.js](https://nextjs.org/docs/testing)
