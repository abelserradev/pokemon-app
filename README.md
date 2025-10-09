# 🎮 Pokemon Battle - Sistema de Gestión de Equipos Pokemon

[![Angular](https://img.shields.io/badge/Angular-20.1-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Aplicación web moderna para gestionar equipos Pokemon, entrenar y optimizar las estadísticas de tus Pokemon favoritos mediante el sistema de EVs (Effort Values).

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Arquitectura](#-arquitectura)
- [API Endpoints](#-api-endpoints)
- [Características Avanzadas](#-características-avanzadas)
- [Deployment](#-deployment)
- [Scripts Disponibles](#-scripts-disponibles)
- [Testing](#-testing)
- [Contribución](#-contribución)
- [Créditos](#-créditos)

## ✨ Características

### 🔐 Autenticación y Seguridad
- Sistema de registro y login con JWT
- Protección de rutas mediante guards
- Interceptores HTTP para manejo automático de tokens
- Gestión segura de sesiones con localStorage

### 👥 Gestión de Equipos
- Búsqueda de Pokemon desde la PokeAPI
- Crear equipos de hasta 6 Pokemon
- Visualización de estadísticas base
- Selección de habilidades
- Eliminación de Pokemon del equipo
- Persistencia en base de datos SQL

### 🎯 Sistema de Entrenamiento EV
- Asignación de EVs (Effort Values) por estadística
- Validación de límites (252 por stat, 510 total)
- Visualización de progreso en tiempo real
- Cálculo de estadísticas finales
- Reset de entrenamiento
- Sistema de guardado automático

### ⭐ Favoritos Inteligentes
- Tracking automático de Pokemon visualizados
- Algoritmo de relevancia basado en:
  - Historial de búsquedas
  - Pokemon en el equipo
  - Frecuencia de uso
- Visualización de top 5 favoritos en el footer

### 🎨 Interfaz de Usuario
- Diseño responsive (móvil, tablet, desktop)
- Menú hamburguesa para móviles
- Sistema de loading con animaciones
- Tema personalizado con paleta de colores Pokemon
- Navegación intuitiva entre generaciones

### 🚀 Optimizaciones
- Lazy loading de módulos
- Caché de Pokemon para mejorar rendimiento
- Gestión eficiente de estado con RxJS
- Build optimizado para producción
- Sin logging en producción

## 🛠 Tecnologías

### Frontend
- **Angular 20.1** - Framework principal
- **TypeScript 5.8** - Lenguaje de programación
- **RxJS 7.8** - Programación reactiva
- **SCSS** - Estilos con preprocesador
- **Angular Router** - Navegación SPA

### Backend
- **FastAPI** - Framework Python para API REST
- **MySQL** - Base de datos relacional
- **SQLAlchemy** - ORM
- **JWT** - Autenticación con tokens

### APIs Externas
- **PokeAPI** - Datos de Pokemon
- **Railway** - Hosting del backend

### DevOps
- **Vercel** - Deployment del frontend
- **GitHub** - Control de versiones
- **Angular CLI** - Herramientas de desarrollo

## 📦 Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Angular CLI** >= 20.x
- **Git**

```bash
# Verificar versiones instaladas
node --version
npm --version
ng version
```

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/abelserradev/pokemon-front.git
cd pokemon-front/Frontend/pokemon-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'
};
```

Crear archivo `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend.railway.app'
};
```

### 4. Iniciar servidor de desarrollo

```bash
npm start
```

Navegar a `http://localhost:4200/`

## ⚙️ Configuración

### Configuración de Angular

El proyecto usa la nueva configuración de `application builder` de Angular 20:

```json
{
  "builder": "@angular/build:application",
  "options": {
    "outputPath": "dist/pokemon-app",
    "index": "src/index.html",
    "browser": "src/main.ts",
    "polyfills": ["zone.js"],
    "tsConfig": "tsconfig.app.json",
    "assets": ["src/favicon.ico", "public"],
    "styles": ["src/styles.scss"],
    "scripts": [],
    "prerender": false,
    "ssr": false
  }
}
```

### Configuración de Rutas

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'pokemon', component: PokemonComponent },
  { path: 'equipo', component: Team, canActivate: [authGuard] },
  { path: 'entrenamiento', component: Training, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '**', redirectTo: '/home' }
];
```

## 📖 Uso

### 1. Registro e Inicio de Sesión

1. Acceder a `/register` para crear una cuenta
2. Completar el formulario con email y contraseña
3. Iniciar sesión en `/login`
4. El sistema almacenará el token JWT automáticamente

### 2. Explorar Pokemon

1. Navegar a `/pokemon`
2. Seleccionar generación (Gen 1-9)
3. Navegar por páginas de 20 Pokemon
4. Ver detalles de cada Pokemon

### 3. Crear Equipo

1. Ir a `/equipo`
2. Buscar Pokemon por nombre
3. Seleccionar habilidad
4. Agregar al equipo (máximo 6)
5. El equipo se guarda automáticamente

### 4. Entrenar Pokemon

1. Acceder a `/entrenamiento`
2. Seleccionar Pokemon del equipo
3. Asignar EVs a las estadísticas
4. Validación automática de límites
5. Aplicar entrenamiento
6. Ver estadísticas finales calculadas

## 📁 Estructura del Proyecto

```
pokemon-app/
├── src/
│   ├── app/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── footer/
│   │   │   ├── header/
│   │   │   ├── hero/
│   │   │   └── loading/
│   │   ├── guards/              # Protección de rutas
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/        # Interceptores HTTP
│   │   │   ├── auth.interceptor.ts
│   │   │   └── loading.interceptor.ts
│   │   ├── models/              # Modelos de datos
│   │   │   └── pokemon.model.ts
│   │   ├── pages/               # Páginas/Vistas
│   │   │   ├── home/
│   │   │   ├── login/
│   │   │   ├── pokemon/
│   │   │   ├── register/
│   │   │   ├── team/
│   │   │   └── training/
│   │   ├── services/            # Servicios
│   │   │   ├── auth.ts
│   │   │   ├── favorites.service.ts
│   │   │   ├── loading.service.ts
│   │   │   ├── pokemon-cache.service.ts
│   │   │   ├── pokemon.service.ts
│   │   │   ├── team.service.ts
│   │   │   └── training.service.ts
│   │   ├── shared/              # Recursos compartidos
│   │   │   └── interfaces.ts
│   │   ├── app.config.ts        # Configuración de la app
│   │   ├── app.routes.ts        # Rutas
│   │   └── app.ts               # Componente raíz
│   ├── environments/            # Variables de entorno
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── public/                      # Recursos públicos
│   ├── batalla.png
│   ├── exploracion.png
│   └── logo_entrenamiento.png
├── angular.json                 # Configuración Angular
├── package.json                 # Dependencias
├── tsconfig.json                # Configuración TypeScript
└── README.md
```

## 🏗 Arquitectura

### Patrón de Arquitectura

El proyecto sigue una **arquitectura modular basada en componentes standalone** de Angular 20:

```
┌─────────────────────────────────────┐
│          Presentation Layer          │
│  (Components + Templates + Styles)   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│         Business Logic Layer         │
│    (Services + State Management)     │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│          Data Access Layer           │
│   (HTTP Interceptors + Guards)       │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│           External APIs              │
│     (Backend API + PokeAPI)          │
└─────────────────────────────────────┘
```

### Gestión de Estado

- **BehaviorSubjects** para estado reactivo
- **Observables** para streams de datos
- **Services** como single source of truth
- **Local caching** para optimización

### Flujo de Datos

```
User Action → Component → Service → HTTP → Backend
                ↓           ↓
            Template ← BehaviorSubject
```

## 🔌 API Endpoints

### Autenticación

```typescript
POST   /register              // Registro de usuario
POST   /login                 // Inicio de sesión
GET    /user/profile          // Perfil del usuario
```

### Equipo Pokemon

```typescript
GET    /pokemon/team          // Obtener equipo
POST   /pokemon/team          // Agregar Pokemon al equipo
DELETE /pokemon/team/:id      // Eliminar Pokemon del equipo
PUT    /pokemon/team/:id/ability  // Actualizar habilidad (local)
```

### Entrenamiento

```typescript
GET    /pokemon/training      // Obtener sesiones de entrenamiento
POST   /pokemon/training      // Crear sesión de entrenamiento
PUT    /pokemon/training/:id  // Aplicar entrenamiento
DELETE /pokemon/training/:id  // Resetear entrenamiento
```

### Favoritos Inteligentes

```typescript
GET    /pokemon/favorites/smart?limit=5    // Favoritos inteligentes
POST   /pokemon/search/track               // Registrar búsqueda
GET    /pokemon/search/history?limit=10    // Historial de búsquedas
```

### PokeAPI (Externa)

```typescript
GET    https://pokeapi.co/api/v2/pokemon/:id      // Pokemon por ID
GET    https://pokeapi.co/api/v2/pokemon/:name    // Pokemon por nombre
```

## 🎯 Características Avanzadas

### 1. Sistema de Caché

```typescript
// pokemon-cache.service.ts
- Caché de Pokemon por generación y página
- Persistencia en memoria durante la sesión
- Reducción de llamadas a PokeAPI
- Mejora de rendimiento hasta 80%
```

### 2. Interceptores HTTP

```typescript
// auth.interceptor.ts
- Inyección automática de token JWT
- Manejo de errores 401 (redirección a login)
- Verificación de autenticación en cada request

// loading.interceptor.ts
- Control automático del spinner de carga
- Gestión de estados de loading
- UX mejorada durante requests HTTP
```

### 3. Guards de Protección

```typescript
// auth.guard.ts
- Verificación de autenticación
- Redirección a login si no autenticado
- Protección de rutas sensibles (/equipo, /entrenamiento)
```

### 4. Transformación de Datos

```typescript
// Snake_case (Backend) → camelCase (Frontend)
- Transformación automática en servicios
- Mapeo bidireccional de propiedades
- Consistencia en todo el frontend
```

### 5. Validaciones

```typescript
// Sistema de Validación de EVs
- Máximo 252 EVs por estadística
- Máximo 510 EVs totales
- Validación en tiempo real
- Mensajes de error descriptivos
```

## 🚢 Deployment

### Vercel (Frontend)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

**Configuración de Vercel:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/pokemon-app/browser",
  "framework": "angular"
}
```

### Variables de Entorno en Vercel

```
VITE_API_URL=https://tu-backend.railway.app
```

### Railway (Backend)

1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Deploy automático en cada push a `main`

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm start              # Servidor de desarrollo (puerto 4200)
npm run watch          # Build con watch mode

# Producción
npm run build          # Build de producción optimizado
npm run build:stats    # Build con análisis de bundle

# Testing
npm test               # Ejecutar tests unitarios
npm run test:coverage  # Tests con cobertura

# Linting
npm run lint           # Verificar código con ESLint
npm run lint:fix       # Corregir errores automáticamente

# Formateo
npm run format         # Formatear código con Prettier
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm test -- --watch
```

### Estructura de Tests

```
src/
├── app/
│   ├── services/
│   │   ├── auth.ts
│   │   └── auth.spec.ts          # Tests del servicio de autenticación
│   ├── components/
│   │   ├── header/
│   │   │   ├── header.ts
│   │   │   └── header.spec.ts    # Tests del componente header
```

### Cobertura Mínima

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## 🤝 Contribución

### Flujo de Trabajo

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Convenciones de Commits

```
Add: Nueva funcionalidad
Fix: Corrección de bugs
Update: Actualización de código existente
Remove: Eliminación de código
Refactor: Refactorización de código
Docs: Cambios en documentación
Style: Cambios de formato (no afectan lógica)
Test: Agregar o actualizar tests
```

### Estándares de Código

- **TypeScript Strict Mode**
- **ESLint** para linting
- **Prettier** para formateo
- **Conventional Commits**
- **Angular Style Guide**

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Abel Serra**
- GitHub: [@abelserradev](https://github.com/abelserradev)
- LinkedIn: [Abel Serra](https://www.linkedin.com/in/abeljserraz)

## 🙏 Créditos

- **PokeAPI** - API de datos Pokemon
- **Angular Team** - Framework Angular
- **FastAPI** - Framework backend
- **Vercel** - Hosting frontend
- **Railway** - Hosting backend

## 📞 Soporte

Para reportar bugs o solicitar nuevas características, por favor crear un issue en GitHub:

[https://github.com/abelserradev/pokemon-front/issues](https://github.com/abelserradev/pokemon-front/issues)

---

⭐ **Si te gusta este proyecto, dale una estrella en GitHub!** ⭐

---

Hecho con ❤️ por Abel Serra
