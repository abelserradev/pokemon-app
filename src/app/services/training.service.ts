import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TrainingSession, TrainingForm, TrainingValidation, PokemonStats } from '../shared/interfaces';
import { Pokemon } from './pokemon.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrainingService {
  private readonly MAX_EV_PER_STAT = 252;
  private readonly MAX_TOTAL_EVS = 510;
  private readonly POINTS_PER_EV = 4;
  private apiUrl = `${environment.apiUrl}/pokemon`;

  private trainingSessionsSubject = new BehaviorSubject<TrainingSession[]>([]);
  public trainingSessions$ = this.trainingSessionsSubject.asObservable();

  public get currentSessions(): TrainingSession[] {
    return this.trainingSessionsSubject.value;
  }

  constructor(private http: HttpClient) {}

  // Limpiar cache y forzar recarga
  clearCache(): void {
    this.trainingSessionsSubject.next([]);
  }

  // Helper para obtener valores de stats con cualquier formato
  private getStat(stats: any, key: string): number {
    if (!stats) {
      return 0;
    }

    // 1. Intentar con la key exacta primero
    if (stats[key] !== undefined) {
      return stats[key];
    }

    // 2. Intentar con guión (backend format: special-attack)
    const dashKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (stats[dashKey] !== undefined) {
      return stats[dashKey];
    }

    // 3. Intentar formato snake_case sin guión
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (stats[snakeKey] !== undefined) {
      return stats[snakeKey];
    }

    return 0;
  }

  // Transformar sesión del backend al formato frontend
  private transformSession(s: any): TrainingSession {

    const baseStats: PokemonStats = {
      hp: this.getStat(s.base_stats, 'hp'),
      attack: this.getStat(s.base_stats, 'attack'),
      defense: this.getStat(s.base_stats, 'defense'),
      specialAttack: this.getStat(s.base_stats, 'specialAttack'),
      specialDefense: this.getStat(s.base_stats, 'specialDefense'),
      speed: this.getStat(s.base_stats, 'speed')
    };

    const currentEVs: PokemonStats = {
      hp: this.getStat(s.current_evs, 'hp'),
      attack: this.getStat(s.current_evs, 'attack'),
      defense: this.getStat(s.current_evs, 'defense'),
      specialAttack: this.getStat(s.current_evs, 'specialAttack'),
      specialDefense: this.getStat(s.current_evs, 'specialDefense'),
      speed: this.getStat(s.current_evs, 'speed')
    };

    const maxEVs: PokemonStats = {
      hp: this.getStat(s.max_evs, 'hp') || 252,
      attack: this.getStat(s.max_evs, 'attack') || 252,
      defense: this.getStat(s.max_evs, 'defense') || 252,
      specialAttack: this.getStat(s.max_evs, 'specialAttack') || 252,
      specialDefense: this.getStat(s.max_evs, 'specialDefense') || 252,
      speed: this.getStat(s.max_evs, 'speed') || 252
    };

    const transformed: TrainingSession = {
      id: s.id,
      pokemonId: s.pokemon_id,
      pokemonName: s.pokemon_name,
      pokemonSprite: s.pokemon_sprite,
      pokemonTypes: s.pokemon_types || [],
      baseStats,        // Ahora siempre definido
      currentEVs,       // Ahora siempre definido
      maxEVs,           // Ahora siempre definido
      trainingPoints: s.training_points || s.remaining_points || 510,
      isCompleted: s.is_completed || false,
      completedAt: s.completed_at ? new Date(s.completed_at) : undefined
    };

    return transformed;
  }

  // Cargar sesiones desde el backend
  loadTrainingSessions(): Observable<TrainingSession[]> {
    return this.http.get<any[]>(`${this.apiUrl}/training`).pipe(
      tap(sessions => {
        const transformedSessions: TrainingSession[] = sessions.map(s => this.transformSession(s));
        this.trainingSessionsSubject.next(transformedSessions);
      })
    );
  }

  // Crear sesión de entrenamiento en el backend
  createTrainingSession(pokemon: Pokemon): Observable<TrainingSession> {
    const baseStats = {
      hp: pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
      attack: pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
      defense: pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
      'special-attack': pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
      'special-defense': pokemon.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
      speed: pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0
    };

    const sessionData = {
      pokemon_id: pokemon.id,
      pokemon_name: pokemon.name,
      pokemon_sprite: pokemon.sprites.front_default,
      pokemon_types: pokemon.types.map(t => t.type.name),
      base_stats: baseStats,
      current_evs: {
        hp: 0,
        attack: 0,
        defense: 0,
        'special-attack': 0,
        'special-defense': 0,
        speed: 0
      },
      max_evs: {
        hp: 252,
        attack: 252,
        defense: 252,
        'special-attack': 252,
        'special-defense': 252,
        speed: 252
      },
      training_points: this.MAX_TOTAL_EVS
    };

    return this.http.post<any>(`${this.apiUrl}/training`, sessionData).pipe(
      tap((session: any) => {
        const transformedSession = this.transformSession(session);

        const currentSessions = this.trainingSessionsSubject.value;
        this.trainingSessionsSubject.next([...currentSessions, transformedSession]);
      })
    );
  }

  // Validar formulario de entrenamiento
  validateTrainingForm(form: TrainingForm, currentEVs: PokemonStats): TrainingValidation {
    const errors: string[] = [];
    let totalPoints = 0;

    // Verificar que currentEVs existe
    if (!currentEVs) {
      return {
        isValid: false,
        errors: ['Error: Datos de EVs no disponibles'],
        totalPoints: 0,
        remainingPoints: this.MAX_TOTAL_EVS
      };
    }

    Object.values(form).forEach(value => {
      totalPoints += value;
    });

    Object.entries(form).forEach(([stat, value]) => {
      const currentEV = currentEVs[stat as keyof PokemonStats] || 0;
      if (value + currentEV > this.MAX_EV_PER_STAT) {
        errors.push(`${this.getStatDisplayName(stat)} no puede exceder ${this.MAX_EV_PER_STAT} EVs`);
      }
    });

    const currentTotal = Object.values(currentEVs).reduce((sum, ev) => sum + (ev || 0), 0);
    if (totalPoints + currentTotal > this.MAX_TOTAL_EVS) {
      errors.push(`El total de EVs no puede exceder ${this.MAX_TOTAL_EVS}`);
    }

    if (totalPoints === 0) {
      errors.push('Debes asignar al menos 1 EV a alguna estadística');
    }

    return {
      isValid: errors.length === 0,
      errors,
      totalPoints,
      remainingPoints: this.MAX_TOTAL_EVS - (totalPoints + currentTotal)
    };
  }

  // Aplicar entrenamiento en el backend
  applyTraining(sessionId: number, form: TrainingForm, currentEVs: PokemonStats): Observable<TrainingSession> {
    const validation = this.validateTrainingForm(form, currentEVs);

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const updatedEVs = {
      hp: currentEVs.hp + form.hp,
      attack: currentEVs.attack + form.attack,
      defense: currentEVs.defense + form.defense,
      'special-attack': currentEVs.specialAttack + form.specialAttack,
      'special-defense': currentEVs.specialDefense + form.specialDefense,
      speed: currentEVs.speed + form.speed
    };

    // Obtener baseStats de manera segura
    const baseStatsSession = this.trainingSessionsSubject.value.find(s => s.id === sessionId);

    if (!baseStatsSession?.baseStats) {
      throw new Error('No se encontraron las estadísticas base del pokémon');
    }

    const maxEVs = this.calculateMaxStats(baseStatsSession.baseStats, {
      hp: updatedEVs.hp,
      attack: updatedEVs.attack,
      defense: updatedEVs.defense,
      specialAttack: updatedEVs['special-attack'],
      specialDefense: updatedEVs['special-defense'],
      speed: updatedEVs.speed
    });

    const updateData = {
      current_evs: updatedEVs,
      max_evs: {
        hp: maxEVs.hp,
        attack: maxEVs.attack,
        defense: maxEVs.defense,
        'special-attack': maxEVs.specialAttack,
        'special-defense': maxEVs.specialDefense,
        speed: maxEVs.speed
      },
      training_points: validation.remainingPoints,
      is_completed: true
    };

    return this.http.put<any>(`${this.apiUrl}/training/${sessionId}`, updateData).pipe(
      tap((updatedSession: any) => {
        const transformedSession = this.transformSession(updatedSession);

        const sessions = this.trainingSessionsSubject.value;
        const index = sessions.findIndex(s => s.id === sessionId);

        if (index !== -1) {
          sessions[index] = transformedSession;
          this.trainingSessionsSubject.next([...sessions]);
        }
      })
    );
  }

  // Calcular estadísticas máximas con EVs
  private calculateMaxStats(baseStats: PokemonStats, evs: PokemonStats): PokemonStats {
    return {
      hp: Math.floor((baseStats.hp * 2 + evs.hp / this.POINTS_PER_EV) / 100) + baseStats.hp + 10,
      attack: Math.floor((baseStats.attack * 2 + evs.attack / this.POINTS_PER_EV) / 100) + baseStats.attack + 5,
      defense: Math.floor((baseStats.defense * 2 + evs.defense / this.POINTS_PER_EV) / 100) + baseStats.defense + 5,
      specialAttack: Math.floor((baseStats.specialAttack * 2 + evs.specialAttack / this.POINTS_PER_EV) / 100) + baseStats.specialAttack + 5,
      specialDefense: Math.floor((baseStats.specialDefense * 2 + evs.specialDefense / this.POINTS_PER_EV) / 100) + baseStats.specialDefense + 5,
      speed: Math.floor((baseStats.speed * 2 + evs.speed / this.POINTS_PER_EV) / 100) + baseStats.speed + 5
    };
  }

  // Obtener nombre de estadística para mostrar
  getStatDisplayName(stat: string): string {
    const statNames: { [key: string]: string } = {
      'hp': 'HP',
      'attack': 'Ataque',
      'defense': 'Defensa',
      'specialAttack': 'Ataque Especial',
      'specialDefense': 'Defensa Especial',
      'speed': 'Velocidad'
    };
    return statNames[stat] || stat;
  }

  // Resetear entrenamiento en el backend
  resetTraining(sessionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/training/${sessionId}`).pipe(
      tap(() => {
        const sessions = this.trainingSessionsSubject.value;
        const filteredSessions = sessions.filter(s => s.id !== sessionId);
        this.trainingSessionsSubject.next(filteredSessions);
      })
    );
  }

  // Resetear entrenamiento por ID de Pokémon
  resetTrainingForPokemon(pokemonId: number): Observable<any> {
    const sessions = this.trainingSessionsSubject.value;
    const sessionToDelete = sessions.find(s => s.pokemonId === pokemonId);
    
    if (sessionToDelete && sessionToDelete.id) {
      return this.resetTraining(sessionToDelete.id);
    } else {
      // Si no hay sesión, devolver observable vacío
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }
  }
}
