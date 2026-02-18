# FM 9 de Julio - PWA Radio Player

Reproductor de radio web progresivo (PWA) para FM 9 de Julio 102.3 MHz.

## Estructura del proyecto

```
fm9dejulio-vercel/
├── public/
│   ├── manifest.json     # Configuración PWA
│   ├── logo.svg          # Logo
│   └── robots.txt        # SEO
├── src/
│   └── app/
│       ├── page.tsx      # Componente principal
│       ├── layout.tsx    # Layout de la app
│       └── globals.css   # Estilos globales
├── package.json          # Dependencias
├── next.config.ts        # Configuración Next.js
├── tsconfig.json         # Configuración TypeScript
├── tailwind.config.ts    # Configuración Tailwind
└── postcss.config.mjs    # Configuración PostCSS
```

## Instrucciones para subir a Vercel

### Paso 1: Crear cuenta en GitHub
1. Ve a [github.com](https://github.com) y crea una cuenta gratuita
2. Verifica tu email

### Paso 2: Crear repositorio
1. Haz clic en el botón **"New"** (verde) o **"+"** > "New repository"
2. Nombre del repositorio: `fm9dejulio-radio`
3. Selecciona **"Private"** o **"Public"**
4. **NO** marques "Add a README file"
5. Haz clic en **"Create repository"**

### Paso 3: Subir los archivos
Tienes dos opciones:

#### Opción A: Subir por interfaz web (más fácil)
1. En tu repositorio vacío, haz clic en **"uploading an existing file"**
2. Arrastra TODOS los archivos y carpetas de este ZIP
3. Escribe un mensaje en "Commit changes"
4. Haz clic en **"Commit changes"**

#### Opción B: Usar GitHub Desktop
1. Descarga [GitHub Desktop](https://desktop.github.com/)
2. Clona tu repositorio
3. Copia los archivos de este ZIP
4. Haz "Commit" y "Push"

### Paso 4: Conectar con Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"** > **"Continue with GitHub"**
3. Autoriza a Vercel con tu cuenta de GitHub
4. Haz clic en **"Add New..."** > **"Project"**
5. Selecciona tu repositorio `fm9dejulio-radio`
6. Haz clic en **"Import"**
7. Deja todas las opciones por defecto
8. Haz clic en **"Deploy"**
9. ¡Espera unos minutos y listo!

### Paso 5: Configurar dominio personalizado
1. En tu proyecto de Vercel, ve a **"Settings"** > **"Domains"**
2. Agrega: `app.fm9dejulio.com.ar`
3. Vercel te dará un registro CNAME para configurar en tu DNS

### Paso 6: Configurar DNS en Hostinger
1. Ve a tu panel de Hostinger
2. Entra a **"DNS"** del dominio `fm9dejulio.com.ar`
3. Agrega un nuevo registro:
   - **Tipo:** CNAME
   - **Nombre:** app
   - **Destino:** cname.vercel-dns.com
4. Espera unos minutos a que se propague

## Funcionalidades

- ✅ Reproducción en segundo plano (móvil)
- ✅ 8 modos de visualizador de audio
- ✅ Visualizadores estéreo (canal L/R)
- ✅ Reconexión automática
- ✅ Botón compartir
- ✅ PWA instalable
- ✅ Media Session API (controles en pantalla de bloqueo)

## Comandos de desarrollo

```bash
# Instalar dependencias
bun install

# Ejecutar en desarrollo
bun run dev

# Construir para producción
bun run build
```

## Soporte

Si tienes problemas, verifica:
1. Que todos los archivos estén subidos correctamente
2. Que el build log en Vercel no tenga errores
3. Que el DNS esté configurado correctamente

---
Desarrollado para FM 9 de Julio - Tres Isletas, Chaco, Argentina
