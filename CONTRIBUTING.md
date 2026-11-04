# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a Pokemon Battle! Esta guía te ayudará a comenzar.

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
3. [Proceso de Desarrollo](#proceso-de-desarrollo)
4. [Estándares de Código](#estándares-de-código)
5. [Guía de Commits](#guía-de-commits)
6. [Pull Requests](#pull-requests)
7. [Reportar Bugs](#reportar-bugs)
8. [Sugerir Mejoras](#sugerir-mejoras)

---

## 📜 Código de Conducta

Este proyecto y todos los que participan en él se rigen por nuestro Código de Conducta. Al participar, se espera que respetes este código.

### Nuestros Estándares

**Comportamientos que contribuyen a crear un ambiente positivo:**
- ✅ Usar lenguaje acogedor e inclusivo
- ✅ Respetar diferentes puntos de vista y experiencias
- ✅ Aceptar críticas constructivas con gracia
- ✅ Enfocarse en lo mejor para la comunidad
- ✅ Mostrar empatía hacia otros miembros

**Comportamientos inaceptables:**
- ❌ Lenguaje o imágenes sexualizadas
- ❌ Trolling, comentarios insultantes o ataques personales
- ❌ Acoso público o privado
- ❌ Publicar información privada de otros
- ❌ Otras conductas no profesionales

---

## 🚀 ¿Cómo puedo contribuir?

### 1. Reportar Bugs
- Usa la plantilla de issue para bugs
- Incluye pasos para reproducir
- Agrega capturas de pantalla si aplica
- Menciona tu entorno (OS, navegador, versión)

### 2. Sugerir Mejoras
- Usa la plantilla de feature request
- Explica el problema que resuelve
- Describe la solución propuesta
- Considera alternativas

### 3. Código
- Corregir bugs
- Implementar nuevas características
- Mejorar documentación
- Optimizar rendimiento
- Agregar tests

### 4. Documentación
- Mejorar README
- Agregar ejemplos de código
- Corregir typos
- Traducir a otros idiomas

---

## 💻 Proceso de Desarrollo

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU_USUARIO/pokemon-front.git
cd pokemon-front/Frontend/pokemon-app

# Agrega el repositorio original como upstream
git remote add upstream https://github.com/abelserradev/pokemon-front.git
```

### 2. Crear Rama

```bash
# Actualiza tu main
git checkout main
git pull upstream main

# Crea una rama para tu feature/fix
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

**Convenciones de Nombres de Ramas:**
- `feature/` - Nueva funcionalidad
- `fix/` - Corrección de bugs
- `docs/` - Cambios en documentación
- `refactor/` - Refactorización de código
- `test/` - Agregar o mejorar tests
- `style/` - Cambios de formato (no afectan lógica)

### 3. Hacer Cambios

```bash
# Instala dependencias
npm install

# Inicia servidor de desarrollo
npm start

# Ejecuta tests
npm test

# Verifica linting
npm run lint
```

### 4. Commit

```bash
# Stage cambios
git add .

# Commit con mensaje descriptivo
git commit -m "Add: descripción del cambio"

# Push a tu fork
git push origin feature/nombre-descriptivo
```

### 5. Pull Request

1. Ve a tu fork en GitHub
2. Click en "New Pull Request"
3. Selecciona tu rama
4. Completa la plantilla de PR
5. Espera revisión

---

## 📝 Estándares de Código

### TypeScript

```typescript
// ✅ Correcto
interface User {
  id: number;
  email: string;
}

function getUser(id: number): Observable<User> {
  return this.http.get<User>(`/api/users/${id}`);
}

// ❌ Incorrecto
function getUser(id: any): any {
  return this.http.get(`/api/users/${id}`);
}
```

### Angular

```typescript
// ✅ Componente standalone
@Component({
  selector: 'app-ejemplo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ejemplo.html',
  styleUrl: './ejemplo.scss'
})
export class EjemploComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}

// ❌ Sin gestión de subscripciones
export class BadComponent {
  ngOnInit() {
    this.service.data$.subscribe(data => {
      // Memory leak!
    });
  }
}
```

### Naming Conventions

```typescript
// Variables y funciones: camelCase
const userName = 'John';
function getUserData() {}

// Clases e Interfaces: PascalCase
class UserService {}
interface UserData {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Archivos: kebab-case
// user-profile.component.ts
// pokemon-service.ts
```

### Organización de Imports

```typescript
// 1. Angular core
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. RxJS
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

// 3. Servicios propios
import { AuthService } from '@services/auth.service';
import { PokemonService } from '@services/pokemon.service';

// 4. Modelos
import { User } from '@models/user.model';

// 5. Relativos
import { environment } from '../environments/environment';
```

### SCSS

```scss
// ✅ BEM naming
.card {
  &__header {
    // ...
  }
  
  &__body {
    // ...
  }
  
  &--highlighted {
    // ...
  }
}

// Variables
$primary-color: #4FB6BE;
$secondary-color: #EBBA68;

// Mixins
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

// Responsive
@media (max-width: 768px) {
  .card {
    width: 100%;
  }
}
```

---

## 📋 Guía de Commits

### Formato

```
<tipo>: <descripción corta>

[cuerpo opcional]

[footer opcional]
```

### Tipos

- `Add` - Nueva funcionalidad
- `Fix` - Corrección de bugs
- `Update` - Actualización de código existente
- `Remove` - Eliminación de código
- `Refactor` - Refactorización sin cambiar funcionalidad
- `Docs` - Cambios en documentación
- `Style` - Cambios de formato (espacios, comas, etc)
- `Test` - Agregar o actualizar tests
- `Chore` - Cambios en build, configs, etc
- `Perf` - Mejoras de rendimiento

### Ejemplos

```bash
# ✅ Buenos commits
git commit -m "Add: user authentication with JWT"
git commit -m "Fix: memory leak in team component"
git commit -m "Update: Pokemon API to v2"
git commit -m "Docs: add contributing guidelines"

# ❌ Malos commits
git commit -m "fixed stuff"
git commit -m "wip"
git commit -m "asdfasdf"
git commit -m "updated files"
```

### Commits Atómicos

Cada commit debe:
- Tener un propósito único
- Pasar todos los tests
- Compilar sin errores
- Ser revertible de forma segura

```bash
# ✅ Correcto - Commits separados
git commit -m "Add: Pokemon search functionality"
git commit -m "Add: Pokemon search tests"
git commit -m "Docs: update README with search feature"

# ❌ Incorrecto - Todo en un commit
git commit -m "Add search, tests, and docs"
```

---

## 🔀 Pull Requests

### Antes de Crear el PR

- [ ] Tests pasan (`npm test`)
- [ ] Linter sin errores (`npm run lint`)
- [ ] Build exitoso (`npm run build`)
- [ ] Código formateado (`npm run format`)
- [ ] Documentación actualizada
- [ ] CHANGELOG.md actualizado (si aplica)

### Plantilla de PR

```markdown
## Descripción
Breve descripción de los cambios

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva característica
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha probado?
Describe las pruebas realizadas

## Checklist
- [ ] Mi código sigue las guías de estilo
- [ ] He realizado self-review
- [ ] He comentado código complejo
- [ ] He actualizado documentación
- [ ] No hay warnings nuevos
- [ ] He agregado tests
- [ ] Tests pasan localmente
- [ ] Cambios dependientes ya fueron merged

## Capturas de Pantalla (si aplica)
```

### Proceso de Revisión

1. **Automated Checks**
   - Tests CI/CD
   - Linter
   - Build
   - Coverage

2. **Code Review**
   - Al menos 1 aprobación
   - Comentarios resueltos
   - Cambios solicitados implementados

3. **Merge**
   - Squash and merge (preferido)
   - Rebase and merge
   - Merge commit

---

## 🐛 Reportar Bugs

### Plantilla de Bug Report

```markdown
**Descripción del Bug**
Descripción clara y concisa del bug.

**Pasos para Reproducir**
1. Ir a '...'
2. Click en '...'
3. Scroll hasta '...'
4. Ver error

**Comportamiento Esperado**
Qué esperabas que sucediera.

**Comportamiento Actual**
Qué sucedió realmente.

**Capturas de Pantalla**
Si aplica, agrega capturas.

**Entorno:**
 - OS: [e.g. Windows 10]
 - Navegador: [e.g. Chrome 120]
 - Versión: [e.g. 1.0.0]

**Información Adicional**
Contexto adicional sobre el problema.
```

### Información Útil

- **Console logs**: Errores de JavaScript
- **Network tab**: Requests fallidos
- **Local Storage**: Estado de la app
- **Angular DevTools**: Estado de componentes

---

## 💡 Sugerir Mejoras

### Plantilla de Feature Request

```markdown
**¿Tu feature request está relacionado con un problema?**
Descripción clara del problema. Ej: Siempre me frustra cuando [...]

**Describe la solución que te gustaría**
Descripción clara de lo que quieres que suceda.

**Describe alternativas que has considerado**
Otras soluciones o features que has considerado.

**Contexto Adicional**
Cualquier contexto sobre el feature request.

**Mockups/Diseños (opcional)**
Si tienes ideas visuales, compártelas.
```

---

## 🧪 Testing

### Escribir Tests

```typescript
// ejemplo.component.spec.ts
describe('EjemploComponent', () => {
  let component: EjemploComponent;
  let fixture: ComponentFixture<EjemploComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EjemploComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(EjemploComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should load data on init', () => {
    component.ngOnInit();
    expect(component.data).toBeDefined();
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests específicos
npm test -- --include='**/auth.service.spec.ts'

# Con cobertura
npm run test:coverage

# Watch mode
npm test -- --watch
```

---

## 📚 Recursos

### Documentación Oficial
- [Angular Docs](https://angular.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RxJS Documentation](https://rxjs.dev/)

### Guías de Estilo
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)

### Herramientas
- [Angular DevTools](https://angular.io/guide/devtools)
- [VS Code Extensions](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template)

---

## ❓ Preguntas

Si tienes preguntas, puedes:
- Abrir un [Issue](https://github.com/abelserradev/pokemon-front/issues)
- Contactar al mantenedor: [LinkedIn](https://www.linkedin.com/in/abeljserraz)

---

## 🎉 Reconocimientos

Todos los colaboradores serán reconocidos en:
- README.md
- CHANGELOG.md
- Página de contribuidores en GitHub

---

**¡Gracias por contribuir a Pokemon Battle!** 🚀

Tu tiempo y esfuerzo son muy apreciados. Juntos podemos hacer de este un proyecto increíble.

---

**Última actualización**: Octubre 2025
**Mantenido por**: Abel Serra

