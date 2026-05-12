# Estructura del Proyecto - Centro Adulto Mayor San Juan Pablo II

Este documento refleja la estructura actual del proyecto (Next.js + App Router) y debe mantenerse actualizado cuando se agreguen, eliminen o muevan carpetas/archivos clave.

## Estructura actual

```text
cam-sanjuanpablosegundo/
|- .env.local
|- .gitignore
|- eslint.config.mjs
|- middleware.ts
|- next-env.d.ts
|- next.config.ts
|- package-lock.json
|- package.json
|- postcss.config.mjs
|- README.md
|- tsconfig.json
|- vercel.json
|
|- app/
|  |- favicon.ico
|  |- globals.css
|  |- layout.tsx
|  |- page.tsx
|  |- home/
|  |  |- page.tsx
|  |- login/
|  |  |- page.tsx
|  |- api/
|     |- auth/
|     |  |- login/
|     |  |  |- route.ts
|     |  |- logout/
|     |  |  |- route.ts
|     |  |- me/
|     |     |- route.ts
|     |- cron/
|     |  |- enviar-reporte-diario/
|     |  |  |- route.ts
|     |  |- keep-alive/
|     |     |- route.ts
|     |- emails/
|     |  |- reporte-medicamentos/
|     |     |- route.ts
|     |- test-connection/
|        |- route.ts
|
|- BD/
|  |- Acceso.ts
|  |- EnumeradoSPs.ts
|
|- lib/
|  |- auth-service.ts
|  |- auth.ts
|  |- supabase.ts
|
|- public/
|  |- ESTRUCTURA.md
|  |- file.svg
|  |- globe.svg
|  |- index.html
|  |- next.svg
|  |- vercel.svg
|  |- window.svg
|  |- css/
|  |  |- base.css
|  |  |- components.css
|  |  |- layout.css
|  |  |- login.css
|  |  |- modals.css
|  |  |- responsive.css
|  |  |- utilities.css
|  |- js/
|     |- auth.js
|     |- buscador.js
|     |- dashboard.js
|     |- data.js
|     |- historial.js
|     |- main.js
|     |- medicamentos.js
|     |- modals.js
|     |- navigation.js
|     |- pacientes.js
|     |- utils.js
```

## Resumen de cada parte

- Raiz del proyecto: concentra configuracion de Next.js, TypeScript, linting, despliegue y dependencias (`package.json`, `next.config.ts`, `tsconfig.json`, `vercel.json`, etc.).
- `.env.local`: guarda variables de entorno locales (credenciales, URLs y secretos), fuera de control de versiones.
- `middleware.ts`: aplica logica transversal a las solicitudes (por ejemplo, proteccion de rutas o redirecciones).
- `app/`: frontend principal con App Router de Next.js (layouts, paginas y estilos globales).
- `app/page.tsx`: pagina de entrada principal.
- `app/home/page.tsx`: pantalla principal para usuarios autenticados.
- `app/login/page.tsx`: pantalla de inicio de sesion.
- `app/api/`: endpoints del backend dentro de Next.js.
- `app/api/auth/`: rutas de autenticacion (`login`, `logout`, `me`).
- `app/api/cron/`: tareas programadas y endpoints de mantenimiento.
- `app/api/emails/`: envio de correos (reporte de medicamentos).
- `app/api/test-connection/`: endpoint de prueba de conectividad/estado.
- `BD/`: capa de acceso a datos y enumeraciones de procedimientos almacenados.
- `lib/`: utilidades compartidas de autenticacion y cliente/configuracion de Supabase.
- `public/`: archivos estaticos servidos directamente (SVG, HTML y recursos del prototipo).
- `public/css/`: estilos del prototipo estatico legado.
- `public/js/`: modulos JS del prototipo estatico legado.
- `public/ESTRUCTURA.md`: documentacion viva de la estructura del proyecto.

## Notas

- El frontend principal vive en `app/` (App Router de Next.js).
- En `public/` se mantiene el prototipo estatico (`index.html`, `css/`, `js/`) como referencia.
- Este archivo se actualiza cada vez que cambie la estructura de carpetas/archivos del proyecto.
