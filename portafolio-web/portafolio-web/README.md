# Portafolio Web — David Vizcarra

Portafolio profesional con dashboards independientes por proyecto.
Stack: Next.js 14 (App Router) + TypeScript + Tailwind. Despliegue en Vercel.

## Editar lo global (no toca dashboards)
- `config/perfil.ts`     -> tus datos (cambia todo el sitio)
- `config/tema.ts`       -> paleta de colores
- `config/proyectos.ts`  -> proyectos (nombre, descripcion, imagen)
- `public/perfil.jpg`    -> tu foto
- `public/proyectos/*.jpg` -> imagenes de cada proyecto

## Agregar un dashboard nuevo (proceso recurrente)
Un dashboard = UNA CARPETA dentro de `dashboards/`. La carpeta lleva 2 archivos:
1. `dashboard.html`  -> el tablero que exportaste
2. `meta.json`       -> 4 datos:
   {
     "proyecto": "hrdt",            // a que proyecto pertenece
     "nombre": "Seguimiento SDD",   // titulo de la tarjeta
     "objetivo": "texto breve...",  // descripcion de la tarjeta
     "esPublico": true              // true = sin contrasena | false = con contrasena
   }
El nombre de la carpeta es el identificador (slug). Al subir la carpeta a GitHub,
la tarjeta aparece sola en la grilla del proyecto. No se toca nada mas.

## Poner contrasena a un dashboard
1. En su `meta.json` pon "esPublico": false
2. En Vercel (Settings -> Environment Variables) agrega/edita:
   - AUTH_SECRET = un texto largo aleatorio
   - DASHBOARD_PASSWORDS = {"slug-del-dashboard":"laClave"}
3. Redeploy. La contrasena se valida en el servidor (no en el navegador).

## Comandos
- npm install        instala dependencias
- npm run dev        desarrollo local (http://localhost:3000)
- npm run build      compila para produccion
