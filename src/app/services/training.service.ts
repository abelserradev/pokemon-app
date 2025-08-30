import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { TrainingSession, TrainingForm, TrainingValidation, PokemonStats } from '../shared/interfaces';
import { Pokemon } from './pokemon.service';


@Injectable({
  providedIn: 'root'
})

export class TrainingService {
  private readonly MAX_EV_PER_STAT = 252;
  private readonly MAX_TOTAL_EVS = 510;
  private readonly POINTS_PER_EV = 4;

  private trainingSessionsSubject = new BehaviorSubject<TrainingSession[]>([]);
  public trainingSessions$ = this.trainingSessionsSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Solo cargar desde localStorage si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.loadTrainingSessions();
    }
  }

  // Crear sesión de entrenamiento para un Pokemon
  createTrainingSession(pokemon: Pokemon): TrainingSession {
    const baseStats: PokemonStats = {
      hp: pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
      attack: pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
      defense: pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
      specialAttack: pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
      specialDefense: pokemon.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
      speed: pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0
    };

    const session: TrainingSession = {
      pokemonId: pokemon.id,
      pokemonName: pokemon.name,
      pokemonSprite: pokemon.sprites.front_default,
      pokemonTypes: pokemon.types.map(t => t.type.name),
      baseStats,
      currentEVs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
      maxEVs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
      trainingPoints: this.MAX_TOTAL_EVS,
      isCompleted: false
    };

    return session;
  }

  // Obtener sesiones de entrenamiento del equipo
  getTeamTrainingSessions(teamPokemon: Pokemon[]): TrainingSession[] {
    const existingSessions = this.trainingSessionsSubject.value;
    const teamSessions: TrainingSession[] = [];

    teamPokemon.forEach(pokemon => {
      let session = existingSessions.find(s => s.pokemonId === pokemon.id);
      if (!session) {
        session = this.createTrainingSession(pokemon);
      }
      teamSessions.push(session);
    });

    return teamSessions;
  }

  // Validar formulario de entrenamiento
  validateTrainingForm(form: TrainingForm, currentEVs: PokemonStats): TrainingValidation {
    const errors: string[] = [];
    let totalPoints = 0;

    // Calcular puntos totales
    Object.values(form).forEach(value => {
      totalPoints += value;
    });

    // Validar límites por estadística
    Object.entries(form).forEach(([stat, value]) => {
      const currentEV = currentEVs[stat as keyof PokemonStats];
      if (value + currentEV > this.MAX_EV_PER_STAT) {
        errors.push(`${this.getStatDisplayName(stat)} no puede exceder ${this.MAX_EV_PER_STAT} EVs`);
      }
    });

    // Validar límite total
    const currentTotal = Object.values(currentEVs).reduce((sum, ev) => sum + ev, 0);
    if (totalPoints + currentTotal > this.MAX_TOTAL_EVS) {
      errors.push(`El total de EVs no puede exceder ${this.MAX_TOTAL_EVS}`);
    }

    // Validar que al menos una estadística tenga EVs
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

  // Aplicar entrenamiento
  applyTraining(pokemonId: number, form: TrainingForm): boolean {
    const sessions = this.trainingSessionsSubject.value;
    const sessionIndex = sessions.findIndex(s => s.pokemonId === pokemonId);

    if (sessionIndex === -1) return false;

    const session = sessions[sessionIndex];
    const validation = this.validateTrainingForm(form, session.currentEVs);

    if (!validation.isValid) return false;

    // Actualizar EVs
    session.currentEVs = {
      hp: session.currentEVs.hp + form.hp,
      attack: session.currentEVs.attack + form.attack,
      defense: session.currentEVs.defense + form.defense,
      specialAttack: session.currentEVs.specialAttack + form.specialAttack,
      specialDefense: session.currentEVs.specialDefense + form.specialDefense,
      speed: session.currentEVs.speed + form.speed
    };

    // Calcular estadísticas máximas
    session.maxEVs = this.calculateMaxStats(session.baseStats, session.currentEVs);
    session.trainingPoints = validation.remainingPoints;
    session.isCompleted = true;
    session.completedAt = new Date();

    sessions[sessionIndex] = session;
    this.trainingSessionsSubject.next([...sessions]);
    this.saveTrainingSessions();

    return true;
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

  // Guardar sesiones en localStorage
  private saveTrainingSessions(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('trainingSessions', JSON.stringify(this.trainingSessionsSubject.value));
      } catch (error) {
        console.error('Error saving training sessions:', error);
      }
    }
  }

  // Cargar sesiones desde localStorage
  private loadTrainingSessions(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem('trainingSessions');
        if (saved) {
          const sessions = JSON.parse(saved);
          this.trainingSessionsSubject.next(sessions);
        }
      } catch (error) {
        console.error('Error loading training sessions:', error);
      }
    }
  }

  // Resetear entrenamiento de un Pokemon
  resetTraining(pokemonId: number): void {
    const sessions = this.trainingSessionsSubject.value;
    const sessionIndex = sessions.findIndex(s => s.pokemonId === pokemonId);

    if (sessionIndex !== -1) {
      const session = sessions[sessionIndex];
      session.currentEVs = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
      session.maxEVs = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
      session.trainingPoints = this.MAX_TOTAL_EVS;
      session.isCompleted = false;
      session.completedAt = undefined;

      sessions[sessionIndex] = session;
      this.trainingSessionsSubject.next([...sessions]);
      this.saveTrainingSessions();
    }
  }
}
