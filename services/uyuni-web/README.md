<h1 align="center">
  <br>
  🌊 UyuniWay
  <br>
</h1>

<h4 align="center">Plataforma web de turismo para el Salar de Uyuni, Bolivia</h4>

<p align="center">
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19">
  </a>
  <a href="https://vitejs.dev/">
    <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  </a>
  <a href="https://supabase.com/">
    <img src="https://img.shields.io/badge/Supabase-2-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  </a>
  <a href="https://uyuni-way.vercel.app">
    <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
  </a>
</p>

<p align="center">
  <a href="https://uyuni-way.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🌐 Ver Demo en Vivo-uyuni--way.vercel.app-blue?style=for-the-badge" alt="Demo en vivo">
  </a>
</p>

<p align="center">
  <a href="#-descripción">Descripción</a> •
  <a href="#-características">Características</a> •
  <a href="#-tecnologías">Tecnologías</a> •
  <a href="#-estructura-del-proyecto">Estructura</a> •
  <a href="#-instalación">Instalación</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-autores">Autores</a>
</p>

---

## 📖 Descripción

**UyuniWay** es una plataforma web de turismo diseñada para promover y facilitar la experiencia de visitar el **Salar de Uyuni**, uno de los destinos más impresionantes de Bolivia y del mundo. La plataforma ofrece información completa sobre tours, guías turísticas, noticias del lugar y un foro comunitario donde los viajeros pueden compartir experiencias.

> 🎯 Este proyecto fue desarrollado como **proyecto de portafolio** para demostrar habilidades en desarrollo web moderno con React, manejo de estado, autenticación, integración de mapas y consumo de bases de datos en tiempo real.

---

## ✨ Características

| Característica | Descripción |
|---|---|
| 🏠 **Página Principal** | Landing page con información destacada del destino |
| 🗺️ **Tours** | Catálogo de tours disponibles con mapa interactivo integrado |
| 📖 **Guía Turística** | Guía completa con información práctica para el viajero |
| 📰 **Noticias** | Sección de noticias y novedades del salar |
| 💬 **Foro Comunitario** | Foro donde los usuarios pueden crear y comentar publicaciones |
| 🔐 **Autenticación** | Sistema de login/registro seguro con Supabase Auth |
| 📱 **Responsive Design** | Diseño completamente adaptable a cualquier dispositivo |
| 🗺️ **Mapas Interactivos** | Mapas con Leaflet para visualizar ubicaciones y rutas |

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| [React](https://react.dev/) | 19 | Framework principal de UI |
| [Vite](https://vitejs.dev/) | 7 | Bundler y servidor de desarrollo |
| [React Router DOM](https://reactrouter.com/) | 7 | Enrutamiento del lado del cliente (SPA) |
| [TailwindCSS](https://tailwindcss.com/) | 3 | Framework de estilos utilitarios |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animaciones fluidas y transiciones |
| [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/) | 1.9 / 5 | Mapas interactivos |
| [Lucide React](https://lucide.dev/) | 0.5 | Librería de íconos |
| [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | — | Utilitarios para clases condicionales |

### Backend & Base de Datos
| Tecnología | Uso |
|---|---|
| [Supabase](https://supabase.com/) | Base de datos PostgreSQL, autenticación y API REST en tiempo real |

### Herramientas de Desarrollo
| Tecnología | Uso |
|---|---|
| [ESLint](https://eslint.org/) | Linter para mantener calidad de código |
| [PostCSS](https://postcss.org/) + [Autoprefixer](https://github.com/postcss/autoprefixer) | Procesamiento de CSS |
| [Google Fonts (Lobster)](https://fonts.google.com/) | Tipografía decorativa del proyecto |

---

## 📁 Estructura del Proyecto

```
uyuni-way-web/
├── public/                  # Archivos estáticos
├── src/
│   ├── assets/              # Imágenes y recursos multimedia
│   ├── components/
│   │   ├── Forum/           # Componentes del foro comunitario
│   │   ├── layout/          # Navbar, Footer y estructura general
│   │   ├── news/            # Componentes de noticias
│   │   ├── sections/        # Secciones reutilizables de páginas
│   │   ├── ui/              # Componentes de interfaz genéricos
│   │   └── utils/           # Componentes utilitarios
│   ├── context/
│   │   └── AuthContext.jsx  # Contexto global de autenticación
│   ├── data/                # Datos estáticos del proyecto
│   ├── lib/                 # Configuración de librerías (Supabase client)
│   ├── pages/
│   │   ├── Home.jsx         # Página principal
│   │   ├── Tours.jsx        # Catálogo de tours con mapa
│   │   ├── Guide.jsx        # Guía turística completa
│   │   ├── NewsPage.jsx     # Sección de noticias
│   │   ├── ForumHome.jsx    # Página principal del foro
│   │   ├── PostDetail.jsx   # Detalle de publicación del foro
│   │   └── Login.jsx        # Página de inicio de sesión
│   ├── App.jsx              # Componente raíz y configuración de rutas
│   ├── main.jsx             # Punto de entrada de la aplicación
│   └── index.css            # Estilos globales
├── index.html               # Plantilla HTML principal
├── vite.config.js           # Configuración de Vite
├── tailwind.config.js       # Configuración de TailwindCSS
├── postcss.config.js        # Configuración de PostCSS
└── package.json             # Dependencias y scripts
```

---

## 🚀 Instalación y Uso

### Requisitos previos
- [Node.js](https://nodejs.org/) (v18 o superior)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/uyuni-way-web.git

# 2. Entrar al directorio del proyecto
cd uyuni-way-web

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
# Crear un archivo .env en la raíz con las siguientes variables:
# VITE_SUPABASE_URL=tu_url_de_supabase
# VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# 5. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con HMR |
| `npm run build` | Genera el bundle de producción |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Ejecuta el linter ESLint |

---

## 📸 Páginas de la Aplicación

- **`/`** → Página de inicio con presentación del destino
- **`/tours`** → Listado y mapa de tours disponibles
- **`/guia`** → Guía turística completa del Salar
- **`/noticias`** → Noticias y novedades
- **`/foro`** → Foro comunitario de viajeros
- **`/foro/:id`** → Detalle de una publicación del foro
- **`/login`** → Inicio de sesión / Registro

---

## 👥 Autores

Este proyecto fue desarrollado en colaboración por:

<table>
  <tr>
    <td align="center">
      <b>David Cruz</b><br>
      <a href="https://github.com/Dally-0">@Dally-0</a>
    </td>
    <td align="center">
      <b>Daniel Maldonado</b><br>
      <a href="https://github.com/infierno666">@infierno666</a>
    </td>
  </tr>
</table>

---

## 🎓 Propósito del Proyecto

Este proyecto fue desarrollado con el objetivo de **demostrar competencias en desarrollo web frontend moderno**, incluyendo:

- ✅ Arquitectura de aplicaciones React con componentes reutilizables
- ✅ Gestión de estado global con Context API
- ✅ Enrutamiento dinámico con React Router v7
- ✅ Integración con backend-as-a-service (Supabase)
- ✅ Autenticación de usuarios
- ✅ Integración de mapas interactivos con Leaflet
- ✅ Diseño responsivo con TailwindCSS
- ✅ Animaciones con Framer Motion
- ✅ Buenas prácticas: ESLint, estructura de carpetas escalable, separación de responsabilidades

---

## 🌐 Demo

> La aplicación está desplegada en producción y disponible públicamente:

**🔗 [https://uyuni-way.vercel.app](https://uyuni-way.vercel.app)**

Hosteada en [Vercel](https://vercel.com/) con deploy automático desde la rama `main`.

---

## 📄 Licencia

Este proyecto es de uso educativo y de portafolio personal.

---

<p align="center">
  Hecho con ❤️ en Bolivia 🇧🇴
</p>
