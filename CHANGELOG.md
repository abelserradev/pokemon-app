# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2025-10-09

### 🎉 Lanzamiento Inicial

#### ✨ Añadido
- **Sistema de Autenticación**
  - Registro de usuarios con email y contraseña
  - Login con JWT tokens
  - Protección de rutas con guards
  - Interceptor para inyección automática de tokens
  - Perfil de usuario en header

- **Gestión de Equipos Pokemon**
  - Búsqueda de Pokemon por nombre (PokeAPI)
  - Agregar hasta 6 Pokemon al equipo
  - Selección de habilidades
  - Visualización de estadísticas base
  - Eliminación de Pokemon del equipo
  - Persistencia en base de datos SQL

- **Sistema de Entrenamiento EV**
  - Asignación de EVs por estadística
  - Validación de límites (252/stat, 510 total)
  - Cálculo de estadísticas finales
  - Progreso visual con barras
  - Reset de entrenamiento
  - Guardado automático en backend

- **Favoritos Inteligentes**
  - Tracking automático de Pokemon visualizados
  - Algoritmo de relevancia basado en:
    - Historial de búsquedas
    - Pokemon en equipo
    - Frecuencia de uso
  - Top 5 favoritos en footer
  - Endpoints smart de favoritos

- **Interfaz de Usuario**
  - Diseño responsive (móvil, tablet, desktop)
  - Menú hamburguesa para móviles
  - Sistema de loading con animaciones
  - Tema personalizado Pokemon
  - Navegación por generaciones (Gen 1-9)
  - Dropdown responsive para generaciones en móvil

- **Optimizaciones**
  - Caché de Pokemon en memoria
  - Lazy loading de componentes
  - TrackBy en listas
  - Gestión eficiente de estado con RxJS
  - Build optimizado para producción

#### 🔧 Configuración
- Angular 20.1 con componentes standalone
- TypeScript 5.8 strict mode
- SCSS para estilos
- ESLint y Prettier configurados
- Variables de entorno para dev/prod
- Deployment en Vercel
- Backend en Railway

#### 📝 Documentación
- README completo con instrucciones
- Documentación técnica para desarrolladores
- Changelog para versiones
- Comentarios en código complejo

#### 🎨 Diseño
- Paleta de colores:
  - Primary: #4FB6BE (turquesa)
  - Secondary: #EBBA68 (dorado)
  - Accent: #F5D05F (amarillo)
  - Text Primary: #014471 (azul oscuro)
- Tipografía responsive
- Espaciado consistente
- Iconos y sprites de Pokemon

### 🐛 Corregido
- Error de localStorage en SSR
- CORS en producción
- Sincronización de datos entre componentes
- Transformación snake_case ↔ camelCase
- Memory leaks por subscripciones
- Overflow horizontal en móviles
- Z-index del menú hamburguesa
- Dropdown de generaciones cortado en móvil

### 🚀 Optimizado
- Reducción de 80% en requests a PokeAPI
- Bundle size optimizado
- Eliminación de console.log en producción
- Change detection mejorada
- Carga de imágenes lazy
- Gestión de estado reactiva

### 🔒 Seguridad
- Tokens JWT con expiración
- Validación de inputs
- Sanitización de datos
- HTTPS en producción
- Headers de seguridad configurados

---

## [Unreleased]

### 🎯 En Desarrollo
- [ ] Sistema de batallas Pokemon
- [ ] Estadísticas de usuario
- [ ] Exportar equipo como imagen
- [ ] Comparador de Pokemon
- [ ] Tema oscuro/claro

### 💡 Ideas Futuras
- [ ] Integración con Pokemon Showdown
- [ ] Chat en tiempo real
- [ ] Torneos entre usuarios
- [ ] Achievements y badges
- [ ] PWA support
- [ ] Notificaciones push

---

## Versiones Anteriores

### [0.2.0] - 2025-10-08
#### Añadido
- Sistema de favoritos inteligentes
- Tracking de Pokemon
- Responsive design mejorado

#### Corregido
- Bugs de sincronización de datos
- Errores de compilación TypeScript

### [0.1.0] - 2025-10-07
#### Añadido
- Autenticación básica
- Gestión de equipos
- Sistema de entrenamiento

---

## Formato de Versiones

### Tipos de Cambios
- `✨ Añadido` - Para nuevas características
- `🔧 Cambiado` - Para cambios en funcionalidad existente
- `🗑️ Deprecado` - Para características que serán eliminadas
- `🚫 Eliminado` - Para características eliminadas
- `🐛 Corregido` - Para corrección de bugs
- `🔒 Seguridad` - Para vulnerabilidades
- `🚀 Optimizado` - Para mejoras de rendimiento
- `📝 Documentación` - Para cambios en docs

### Versionado Semántico
- **MAJOR** (1.x.x) - Cambios incompatibles con versión anterior
- **MINOR** (x.1.x) - Nueva funcionalidad compatible
- **PATCH** (x.x.1) - Correcciones de bugs compatibles

---

## Links

- [Repositorio](https://github.com/abelserradev/pokemon-front)
- [Producción](https://pokemon-app-gules-zeta.vercel.app)
- [Issues](https://github.com/abelserradev/pokemon-front/issues)
- [Releases](https://github.com/abelserradev/pokemon-front/releases)

---

**Mantenido por**: Abel Serra
**Última actualización**: 9 de Octubre, 2025

