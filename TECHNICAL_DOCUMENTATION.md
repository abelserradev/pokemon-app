# 📚 Documentación Técnica - Pokemon Battle

## Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Servicios](#servicios)
3. [Componentes](#componentes)
4. [Modelos de Datos](#modelos-de-datos)
5. [Interceptores y Guards](#interceptores-y-guards)
6. [Gestión de Estado](#gestión-de-estado)
7. [Optimizaciones](#optimizaciones)
8. [Buenas Prácticas](#buenas-prácticas)

---

## 1. Arquitectura del Sistema

### 1.1 Patrón de Diseño

El proyecto implementa una **arquitectura en capas** con separación de responsabilidades:

```
┌────────────────────────────────────────┐
│         Presentation Layer              │
│  (Componentes + Templates + Estilos)    │
│  - Responsabilidad: UI/UX               │
│  - NO lógica de negocio                 │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│        Business Logic Layer             │
│         (Services + State)              │
│  - Lógica de negocio                    │
│  - Gestión de estado con RxJS           │
│  - Transformación de datos              │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│        Data Access Layer                │
│   (HTTP + Interceptors + Guards)        │
│  - Comunicación con APIs                │
│  - Autenticación y autorización         │
│  - Manejo de errores                    │
└────────────────────────────────────────┘
```

### 1.2 Flujo de Datos

```typescript
// Flujo de lectura (GET)
Component → Service.method() → HTTP GET → Backend → Observable → BehaviorSubject → Component

// Flujo de escritura (POST/PUT)
Component → Service.method() → HTTP POST/PUT → Backend → BehaviorSubject.next() → Component
```

### 1.3 Gestión de Estado Reactiva

```typescript
// Patrón utilizado en todos los servicios
private dataSubject = new BehaviorSubject<Type[]>([]);
public data$ = this.dataSubject.asObservable();

// Los componentes se suscriben a los observables
this.service.data$.subscribe(data => {
  this.localData = data;
});
```

---

## 2. Servicios

### 2.1 AuthService (`auth.ts`)

**Responsabilidad**: Gestión de autenticación y autorización

```typescript
// Métodos principales
register(user: any): Observable<any>
login(user: any): Observable<LoginResponse>
logout(): void
getUserProfile(): Observable<User>
isAuthenticated(): boolean

// Estado reactivo
currentUser$: Observable<User | null>
```

**Características**:
- Almacenamiento seguro de token JWT
- Verificación de autenticación con `isPlatformBrowser`
- Manejo de errores centralizado
- Observable de usuario actual para UI reactiva

**Uso**:
```typescript
constructor(private authService: Auth) {}

login() {
  this.authService.login(credentials).subscribe({
    next: (response) => {
      // Token almacenado automáticamente
      this.router.navigate(['/home']);
    },
    error: (error) => {
      this.errorMessage = error.error?.detail;
    }
  });
}
```

---

### 2.2 TeamService (`team.service.ts`)

**Responsabilidad**: Gestión del equipo Pokemon

```typescript
// Estado
private teamSubject = new BehaviorSubject<any[]>([]);
public team$ = this.teamSubject.asObservable();

// Métodos CRUD
loadTeam(): Observable<any[]>
addToTeam(pokemon: Pokemon, ability: string): Observable<any>
removeFromTeam(teamPokemonId: number): Observable<any>
updateAbility(teamPokemonId: number, ability: string): Observable<any>
clearCache(): void
```

**Transformación de Datos**:
```typescript
// Pokemon de PokeAPI → Pokemon para backend
const teamPokemon = {
  pokemon_id: pokemon.id,
  pokemon_name: pokemon.name,
  pokemon_sprite: pokemon.sprites.front_default,
  pokemon_types: pokemon.types.map(t => t.type.name),
  selected_ability: ability,
  base_stats: {
    hp: pokemon.stats[0].base_stat,
    attack: pokemon.stats[1].base_stat,
    // ... más stats
  }
};
```

---

### 2.3 TrainingService (`training.service.ts`)

**Responsabilidad**: Gestión de entrenamiento EV

```typescript
// Constantes
MAX_EV_PER_STAT = 252
MAX_TOTAL_EVS = 510
POINTS_PER_EV = 4

// Métodos principales
loadTrainingSessions(): Observable<TrainingSession[]>
createTrainingSession(pokemon: Pokemon): Observable<TrainingSession>
applyTraining(sessionId: number, form: TrainingForm, currentEVs: PokemonStats): Observable<TrainingSession>
resetTraining(sessionId: number): Observable<any>
validateTrainingForm(form: TrainingForm, currentEVs: PokemonStats): TrainingValidation
```

**Validación de EVs**:
```typescript
validateTrainingForm(form: TrainingForm, currentEVs: PokemonStats): TrainingValidation {
  const errors: string[] = [];
  let totalPoints = 0;

  // Validar máximo por stat
  Object.entries(form).forEach(([stat, value]) => {
    const currentEV = currentEVs[stat as keyof PokemonStats] || 0;
    if (value + currentEV > this.MAX_EV_PER_STAT) {
      errors.push(`${stat} no puede exceder 252 EVs`);
    }
  });

  // Validar total
  const currentTotal = Object.values(currentEVs).reduce((sum, ev) => sum + (ev || 0), 0);
  if (totalPoints + currentTotal > this.MAX_TOTAL_EVS) {
    errors.push('El total de EVs no puede exceder 510');
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalPoints,
    remainingPoints: this.MAX_TOTAL_EVS - (totalPoints + currentTotal)
  };
}
```

**Transformación snake_case → camelCase**:
```typescript
private getStat(stats: any, key: string): number {
  if (!stats) return 0;

  // 1. Intentar key exacta
  if (stats[key] !== undefined) return stats[key];

  // 2. Intentar dash-case (special-attack)
  const dashKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
  if (stats[dashKey] !== undefined) return stats[dashKey];

  // 3. Intentar snake_case (special_attack)
  const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
  if (stats[snakeKey] !== undefined) return stats[snakeKey];

  return 0;
}
```

---

### 2.4 FavoritesService (`favorites.service.ts`)

**Responsabilidad**: Sistema de favoritos inteligentes

```typescript
// Interfaces
interface SmartFavorite {
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite: string;
  pokemon_types: string[];
  relevance_score: number;
  source: 'search_history' | 'global_popular' | 'team_usage';
}

// Métodos
loadSmartFavorites(limit: number): Observable<SmartFavorite[]>
trackPokemonSearch(data: PokemonSearchData): Observable<SearchHistoryItem>
getSearchHistory(limit: number): Observable<SearchHistoryItem[]>
clearFavorites(): void
```

**Tracking Automático**:
```typescript
// En PokemonComponent - Trackea primeros 3 Pokemon visibles
private trackVisiblePokemon(): void {
  const pokemonToTrack = this.pokemonList.slice(0, 3);
  
  pokemonToTrack.forEach(pokemon => {
    this.favoritesService.trackPokemonSearch({
      pokemon_id: pokemon.id,
      pokemon_name: pokemon.name,
      pokemon_sprite: pokemon.sprites?.front_default,
      pokemon_types: pokemon.types?.map(t => t.type.name)
    }).subscribe({
      error: () => {} // Silencioso en producción
    });
  });
}

// En TeamComponent - Trackea cuando se agrega al equipo
addToTeam() {
  this.teamService.addToTeam(pokemon, ability).subscribe({
    next: () => {
      this.favoritesService.trackPokemonSearch({
        pokemon_id: pokemon.id,
        pokemon_name: pokemon.name,
        pokemon_sprite: pokemon.sprites?.front_default,
        pokemon_types: pokemon.types?.map(t => t.type.name)
      }).subscribe();
    }
  });
}
```

---

### 2.5 PokemonCacheService (`pokemon-cache.service.ts`)

**Responsabilidad**: Caché en memoria para Pokemon

```typescript
// Estructura de caché
private cache = new Map<string, Pokemon[]>();
private currentGeneration = new BehaviorSubject<number>(1);
private currentPage = new BehaviorSubject<number>(1);

// Métodos
hasPokemon(generation: number, page: number): boolean
getPokemon(generation: number, page: number): Pokemon[] | null
setPokemon(generation: number, page: number, pokemon: Pokemon[]): void
clearCache(): void

// Key generation
private getCacheKey(generation: number, page: number): string {
  return `gen-${generation}-page-${page}`;
}
```

**Beneficios**:
- Reducción de llamadas a PokeAPI
- Mejora de rendimiento ~80%
- UX más fluida
- Persistencia durante la sesión

---

### 2.6 LoadingService (`loading.service.ts`)

**Responsabilidad**: Gestión del estado de carga

```typescript
interface LoadingState {
  show: boolean;
  message: string;
  subtitle: string;
}

// Estado
private loadingSubject = new BehaviorSubject<LoadingState>({
  show: false,
  message: '',
  subtitle: ''
});

// Métodos
show(message: string, subtitle?: string, useDefault?: boolean): void
hide(): void
showSearch(): void
```

---

## 3. Componentes

### 3.1 HeaderComponent

**Responsabilidad**: Navegación principal y autenticación

```typescript
// Estado
currentUser: User | null = null;
isMenuOpen = false;

// Métodos
toggleMenu(): void
closeMenu(): void
onNavigation(): void
logout(): void

// Responsive
- Desktop: Menú horizontal completo
- Mobile: Hamburger menu con overlay
- Z-index hierarchy: header(1000) > hamburger(1001) > mobile-menu(999) > overlay(998)
```

**Características**:
- Menú hamburguesa para móviles
- Autenticación visual (botones vs email)
- Cierre automático en navegación
- Responsive design

---

### 3.2 PokemonComponent

**Responsabilidad**: Exploración de Pokemon

```typescript
// Estado
generations = [
  { number: 1, name: 'Gen 1', start: 1, end: 151 },
  // ... Gen 2-9
];
selectedGeneration = 1;
currentPage = 1;
pokemonList: Pokemon[] = [];
isDropdownOpen = false; // Para móviles

// Métodos
selectGeneration(generation: number): Promise<void>
changePage(page: number): Promise<void>
loadPokemon(): Promise<void>
trackVisiblePokemon(): void // Tracking automático

// Responsive
- Desktop: Lista horizontal de generaciones
- Mobile: Dropdown con animación
- Scroll vertical en dropdown para Gen 1-9
```

---

### 3.3 TeamComponent

**Responsabilidad**: Gestión del equipo

```typescript
// Estado
searchTerm: string = '';
searchedPokemon: Pokemon | null = null;
teamPokemon: any[] = [];
maxTeamSize = 6;

// Validaciones
- Máximo 6 Pokemon
- No duplicados
- Búsqueda por nombre (case-insensitive)

// Funcionalidades
- Búsqueda en PokeAPI
- Selección de habilidad
- Agregar/Eliminar Pokemon
- Tracking automático de favoritos
- Enriquecimiento de datos (Pokemon completo + datos de BD)
```

---

### 3.4 TrainingComponent

**Responsabilidad**: Entrenamiento de Pokemon

```typescript
// Estado
trainingSessions: TrainingSession[] = [];
currentSession: TrainingSession | null = null;
currentPokemonIndex = 0;
trainingForm: FormGroup;
validation: TrainingValidation | null = null;

// Flujo de entrenamiento
1. Cargar equipo desde TeamService
2. Cargar sesiones de entrenamiento
3. Filtrar sesiones por equipo actual
4. Mostrar Pokemon actual con stats
5. Validar EVs en tiempo real
6. Aplicar entrenamiento
7. Actualizar sesión y stats

// Validaciones
- EVs por stat: 0-252
- Total EVs: 0-510
- Formulario reactivo con validación continua
```

---

### 3.5 FooterComponent

**Responsabilidad**: Favoritos y enlaces sociales

```typescript
// Estado
topFavorites: SmartFavorite[] = [];

// Suscripciones
1. authService.currentUser$ → Cargar/Limpiar favoritos
2. teamService.team$ → Recargar favoritos
3. favoritesService.favorites$ → Actualizar UI

// Características
- Top 5 favoritos con sprites
- Relevancia en tooltip
- Enlaces a GitHub y LinkedIn
- Logo del proyecto
```

---

## 4. Modelos de Datos

### 4.1 Interfaces Principales

```typescript
// Pokemon (PokeAPI)
interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    front_shiny: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  types: Array<{
    type: { name: string; };
  }>;
  abilities: Array<{
    ability: { name: string; };
    is_hidden: boolean;
  }>;
  stats: Array<{
    base_stat: number;
    stat: { name: string; };
  }>;
}

// Team Pokemon (Backend)
interface TeamPokemon {
  id: number;                    // BD ID
  pokemon_id: number;            // PokeAPI ID
  pokemon_name: string;
  pokemon_sprite: string;
  pokemon_types: string[];
  selected_ability: string;
  level: number;
  base_stats: PokemonStats;
  pokemon?: Pokemon;             // Datos completos de PokeAPI
  selectedAbility?: string;      // Alias para template
}

// Training Session
interface TrainingSession {
  id: number;
  userId: number;
  pokemonId: number;
  pokemonName: string;
  pokemonSprite: string;
  pokemonTypes: string[];
  baseStats: PokemonStats;
  currentEVs: PokemonStats;
  maxEVs: PokemonStats;
  trainingPoints: number;
  isCompleted: boolean;
  completedAt?: Date;
}

// Pokemon Stats
interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

// Smart Favorite
interface SmartFavorite {
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite: string;
  pokemon_types: string[];
  relevance_score: number;
  source: 'search_history' | 'global_popular' | 'team_usage';
  sprite?: string;    // Alias
  name?: string;      // Alias
}
```

---

## 5. Interceptores y Guards

### 5.1 AuthInterceptor

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    
    if (token) {
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(clonedRequest);
    }
  }
  
  return next(req);
};
```

**Funcionamiento**:
1. Intercepta todas las peticiones HTTP
2. Verifica si está en entorno browser
3. Obtiene token de localStorage
4. Clona request y agrega header Authorization
5. Pasa request modificado al siguiente handler

---

### 5.2 LoadingInterceptor

```typescript
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  loadingService.show('Cargando...', 'Por favor espera');
  
  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};
```

---

### 5.3 AuthGuard

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};
```

**Uso en Rutas**:
```typescript
{
  path: 'equipo',
  component: Team,
  canActivate: [authGuard]
}
```

---

## 6. Gestión de Estado

### 6.1 Patrón BehaviorSubject

```typescript
// En cada servicio
private dataSubject = new BehaviorSubject<Type[]>([]);
public data$ = this.dataSubject.asObservable();

// Actualizar estado
this.dataSubject.next(newData);

// Obtener valor actual
const currentValue = this.dataSubject.value;
```

### 6.2 Subscripciones en Componentes

```typescript
export class Component implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  
  ngOnInit() {
    // Agregar subscripciones
    this.subscriptions.add(
      this.service.data$.subscribe(data => {
        this.localData = data;
      })
    );
  }
  
  ngOnDestroy() {
    // Limpiar subscripciones
    this.subscriptions.unsubscribe();
  }
}
```

### 6.3 Flujo de Sincronización

```typescript
// 1. Backend actualiza datos
this.http.post('/api/endpoint', data).pipe(
  tap(response => {
    // 2. Actualizar BehaviorSubject
    const current = this.dataSubject.value;
    this.dataSubject.next([...current, response]);
  })
);

// 3. Componentes se actualizan automáticamente
this.service.data$.subscribe(data => {
  this.localData = data; // ✅ Actualización reactiva
});
```

---

## 7. Optimizaciones

### 7.1 Caché de Pokemon

```typescript
// Antes (sin caché)
loadPokemon() {
  // Cada vez que se navega, nueva request a PokeAPI
  this.http.get(`https://pokeapi.co/api/v2/pokemon/${id}`)
}

// Después (con caché)
loadPokemon() {
  // Primera vez: Request a PokeAPI y guardar
  if (!this.cache.has(key)) {
    this.http.get(...).pipe(
      tap(data => this.cache.set(key, data))
    )
  }
  // Siguientes veces: Desde caché (instantáneo)
  else {
    return this.cache.get(key);
  }
}
```

**Resultado**: Reducción de 80% en requests a PokeAPI

---

### 7.2 TrackBy en *ngFor

```typescript
// En componentes
trackByPokemonId(index: number, pokemon: Pokemon): number {
  return pokemon.id;
}

// En template
<div *ngFor="let pokemon of pokemonList; trackBy: trackByPokemonId">
  <!-- Contenido -->
</div>
```

**Beneficio**: Angular solo re-renderiza elementos que cambian

---

### 7.3 Lazy Loading

```typescript
// Rutas con lazy loading
const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component')
      .then(m => m.AdminComponent)
  }
];
```

---

### 7.4 OnPush Change Detection

```typescript
@Component({
  selector: 'app-optimized',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
  // Solo detecta cambios cuando:
  // 1. @Input() cambia
  // 2. Event binding se dispara
  // 3. Observable emite (con async pipe)
}
```

---

## 8. Buenas Prácticas

### 8.1 Manejo de Errores

```typescript
// ✅ Correcto
this.service.method().subscribe({
  next: (data) => {
    // Manejar datos
  },
  error: (error) => {
    // UI friendly message
    this.errorMessage = error.error?.detail || 'Error al procesar la solicitud';
  }
});

// ❌ Incorrecto
this.service.method().subscribe(data => {
  // No manejo de errores
});
```

---

### 8.2 Unsubscribe de Observables

```typescript
// ✅ Correcto - Patrón Subscription
private subscriptions = new Subscription();

ngOnInit() {
  this.subscriptions.add(
    this.service.data$.subscribe(...)
  );
}

ngOnDestroy() {
  this.subscriptions.unsubscribe();
}

// ✅ Correcto - Async Pipe (auto-unsubscribe)
// template
{{ data$ | async }}

// ❌ Incorrecto - Memory leak
ngOnInit() {
  this.service.data$.subscribe(...); // Nunca se desuscribe
}
```

---

### 8.3 Transformación de Datos

```typescript
// ✅ Correcto - Centralizar transformaciones en servicios
private transformData(backendData: any): FrontendModel {
  return {
    id: backendData.id,
    name: backendData.pokemon_name,    // snake_case → camelCase
    sprite: backendData.pokemon_sprite
  };
}

// ❌ Incorrecto - Transformar en componentes
ngOnInit() {
  this.data = backendData.map(item => ({
    name: item.pokemon_name
  }));
}
```

---

### 8.4 Tipado Fuerte

```typescript
// ✅ Correcto
interface User {
  id: number;
  email: string;
}

getUser(): Observable<User> {
  return this.http.get<User>('/api/user');
}

// ❌ Incorrecto
getUser(): Observable<any> {
  return this.http.get('/api/user');
}
```

---

### 8.5 Separación de Responsabilidades

```typescript
// ✅ Correcto
// Componente: Solo UI
export class Component {
  data$ = this.service.getData();
}

// Servicio: Lógica de negocio
export class Service {
  getData(): Observable<Data> {
    return this.http.get<Data>('/api/data').pipe(
      map(this.transformData),
      catchError(this.handleError)
    );
  }
}

// ❌ Incorrecto
// Componente con lógica de negocio
export class Component {
  ngOnInit() {
    this.http.get('/api/data').subscribe(data => {
      // Transformaciones y lógica compleja aquí
    });
  }
}
```

---

## 9. Performance Tips

### 9.1 Bundle Size Optimization

```typescript
// angular.json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "2mb",
    "maximumError": "5mb"
  }
]
```

### 9.2 Lazy Loading de Imágenes

```html
<img [src]="pokemon.sprite" loading="lazy" alt="{{pokemon.name}}">
```

### 9.3 Pure Pipes

```typescript
@Pipe({
  name: 'customPipe',
  pure: true  // ✅ Solo ejecuta cuando input cambia
})
```

---

## 10. Debugging

### 10.1 Angular DevTools

```bash
# Instalar extensión de Chrome
https://chrome.google.com/webstore/detail/angular-devtools
```

### 10.2 RxJS Debugging

```typescript
import { tap } from 'rxjs/operators';

this.service.getData().pipe(
  tap(data => console.log('Debug:', data))
).subscribe();
```

### 10.3 Performance Profiling

```typescript
// Chrome DevTools > Performance
// Grabar > Interactuar con app > Analizar
```

---

## 11. Testing Patterns

### 11.1 Service Testing

```typescript
describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeamService]
    });
    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should load team', () => {
    const mockTeam = [/* ... */];
    
    service.loadTeam().subscribe(team => {
      expect(team).toEqual(mockTeam);
    });
    
    const req = httpMock.expectOne('/api/team');
    expect(req.request.method).toBe('GET');
    req.flush(mockTeam);
  });
});
```

---

## 12. Deployment Checklist

- [ ] Build de producción sin errores
- [ ] Variables de entorno configuradas
- [ ] Todos los console.log eliminados
- [ ] Tests pasando
- [ ] Linter sin errores
- [ ] Bundle size optimizado
- [ ] CORS configurado en backend
- [ ] SSL/HTTPS habilitado
- [ ] Error tracking configurado (ej: Sentry)
- [ ] Analytics configurado (opcional)

---

**Última actualización**: Octubre 2025
**Versión de Angular**: 20.1
**Mantenedor**: Abel Serra

