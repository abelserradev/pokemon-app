import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PokemonTeam, PokemonTeamCreate, PokemonTeamUpdate, PokemonTeamMemberCreate } from '../shared/interfaces';
import { environment } from '../../environments/environment';

interface LoadForTrainingResponse {
  message: string;
  team_loaded: any;
  sessions_created: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PokemonTeamsService {
  private apiUrl = `${environment.apiUrl}/pokemon`;
  
  private teamsSubject = new BehaviorSubject<PokemonTeam[]>([]);
  public teams$ = this.teamsSubject.asObservable();
  
  private selectedTeamForTrainingSubject = new BehaviorSubject<PokemonTeam | null>(null);
  public selectedTeamForTraining$ = this.selectedTeamForTrainingSubject.asObservable();

  public get currentTeams(): PokemonTeam[] {
    return this.teamsSubject.value;
  }

  constructor(private http: HttpClient) {}

  // Cargar todos los equipos del usuario
  loadTeams(): Observable<PokemonTeam[]> {
    return this.http.get<PokemonTeam[]>(`${this.apiUrl}/teams`).pipe(
      tap(teams => {
        this.teamsSubject.next(teams);
      })
    );
  }

  // Crear equipo desde el equipo actual del componente team
  createTeamFromCurrentTeam(teamPokemon: any[]): Observable<PokemonTeam> {
    const teamName = this.generateTeamName();
    
    // Mapear los Pokémon del equipo actual al formato del backend
    const teamMembers: PokemonTeamMemberCreate[] = teamPokemon.map((p, index) => ({
      pokemon_id: p.pokemon_id,
      pokemon_name: p.pokemon?.name || 'unknown',
      pokemon_sprite: p.pokemon?.sprites?.front_default,
      pokemon_types: p.pokemon?.types?.map((t: any) => t.type.name),
      selected_ability: p.selected_ability,
      position: index + 1,
      level: p.level || 50,
      evs: p.evs ? {
        hp: p.evs.hp || 0,
        attack: p.evs.attack || 0,
        defense: p.evs.defense || 0,
        'special-attack': p.evs.specialAttack || 0,
        'special-defense': p.evs.specialDefense || 0,
        speed: p.evs.speed || 0
      } : undefined,
      nickname: undefined,
      move_1: undefined,
      move_2: undefined,
      move_3: undefined,
      move_4: undefined,
      held_item: undefined,
      nature: undefined,
      ivs: undefined
    }));

    const teamData: PokemonTeamCreate = {
      team_name: teamName,
      description: `Equipo creado el ${new Date().toLocaleDateString()}`,
      is_favorite: false,
      team_members: teamMembers
    };

    return this.http.post<PokemonTeam>(`${this.apiUrl}/teams`, teamData).pipe(
      tap(newTeam => {
        const currentTeams = this.teamsSubject.value;
        this.teamsSubject.next([...currentTeams, newTeam]);
      })
    );
  }

  // Crear equipo desde sesiones de entrenamiento
  createTeamFromTrainingSessions(sessions: any[]): Observable<PokemonTeam> {
    const teamName = this.generateTeamName();
    
    // Mapear las sesiones de entrenamiento al formato del backend
    const teamMembers: PokemonTeamMemberCreate[] = sessions.map((session, index) => ({
      pokemon_id: session.pokemonId,
      pokemon_name: session.pokemonName,
      pokemon_sprite: session.pokemonSprite || '',
      pokemon_types: session.pokemonTypes || [],
      position: index + 1,
      level: 100,
      evs: session.currentEVs ? {
        hp: session.currentEVs.hp || 0,
        attack: session.currentEVs.attack || 0,
        defense: session.currentEVs.defense || 0,
        'special-attack': session.currentEVs.specialAttack || 0,
        'special-defense': session.currentEVs.specialDefense || 0,
        speed: session.currentEVs.speed || 0
      } : undefined
    }));

    const teamData: PokemonTeamCreate = {
      team_name: teamName,
      description: `Equipo entrenado el ${new Date().toLocaleDateString()}`,
      is_favorite: false,
      team_members: teamMembers
    };

    return this.http.post<PokemonTeam>(`${this.apiUrl}/teams`, teamData).pipe(
      tap(newTeam => {
        const currentTeams = this.teamsSubject.value;
        this.teamsSubject.next([...currentTeams, newTeam]);
      })
    );
  }

  // Actualizar un equipo existente
  updateTeam(teamId: number, teamData: PokemonTeamUpdate): Observable<PokemonTeam> {
    return this.http.put<PokemonTeam>(`${this.apiUrl}/teams/${teamId}`, teamData).pipe(
      tap(updatedTeam => {
        const teams = this.teamsSubject.value;
        const index = teams.findIndex(t => t.id === teamId);
        if (index !== -1) {
          teams[index] = updatedTeam;
          this.teamsSubject.next([...teams]);
        }
      })
    );
  }

  // Eliminar un equipo
  deleteTeam(teamId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/teams/${teamId}`).pipe(
      tap(() => {
        const teams = this.teamsSubject.value;
        const filteredTeams = teams.filter(t => t.id !== teamId);
        this.teamsSubject.next(filteredTeams);
      }),
      catchError(error => {
        console.error('Error al eliminar equipo:', error);
        // Si es 401, el equipo se eliminó pero el token expiró
        if (error.status === 401) {
          const teams = this.teamsSubject.value;
          const filteredTeams = teams.filter(t => t.id !== teamId);
          this.teamsSubject.next(filteredTeams);
        }
        throw error;
      })
    );
  }

  // Obtener un equipo por ID
  getTeamById(teamId: number): Observable<PokemonTeam> {
    return this.http.get<PokemonTeam>(`${this.apiUrl}/teams/${teamId}`);
  }

  // Activar/desactivar favorito
  toggleTeamFavorite(teamId: number): Observable<PokemonTeam> {
    return this.http.patch<PokemonTeam>(`${this.apiUrl}/teams/${teamId}/favorite`, {}).pipe(
      tap(updatedTeam => {
        const teams = this.teamsSubject.value;
        const index = teams.findIndex(t => t.id === teamId);
        if (index !== -1) {
          teams[index] = updatedTeam;
          this.teamsSubject.next([...teams]);
        }
      })
    );
  }

  // Generar nombre automático para el equipo
  generateTeamName(): string {
    const teams = this.teamsSubject.value;
    const teamNumber = teams.length + 1;
    return `Equipo Pokémon ${teamNumber}`;
  }

  // Verificar si hay equipos disponibles
  hasTeams(): boolean {
    return this.teamsSubject.value.length > 0;
  }

  // Obtener equipos favoritos
  getFavoriteTeams(): PokemonTeam[] {
    return this.teamsSubject.value.filter(team => team.is_favorite);
  }

  // Guardar equipo seleccionado para entrenamiento
  setSelectedTeamForTraining(team: PokemonTeam): void {
    this.selectedTeamForTrainingSubject.next(team);
  }

  // Limpiar equipo seleccionado
  clearSelectedTeamForTraining(): void {
    this.selectedTeamForTrainingSubject.next(null);
  }

  // Cargar equipo guardado para entrenamiento (crea sesiones de training)
  loadTeamForTraining(teamId: number): Observable<LoadForTrainingResponse> {
    return this.http.post<LoadForTrainingResponse>(
      `${this.apiUrl}/teams/${teamId}/load-for-training`, 
      {}
    ).pipe(
      tap(response => {
        console.log('Equipo cargado para entrenamiento:', response);
        // Guardar el ID del equipo que está siendo entrenado
        localStorage.setItem('currentTrainingTeamId', teamId.toString());
      }),
      catchError(error => {
        console.error('Error al cargar equipo para training:', error);
        throw error;
      })
    );
  }

  // Actualizar EVs del equipo guardado después de entrenar
  updateTeamEVs(teamId: number, updatedMembers: any[]): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/teams/${teamId}/update-evs`,
      { updated_members: updatedMembers }
    ).pipe(
      tap(response => {
        console.log('EVs del equipo actualizados:', response);
      }),
      catchError(error => {
        console.error('Error al actualizar EVs:', error);
        throw error;
      })
    );
  }

  // Obtener ID del equipo actualmente en training
  getCurrentTrainingTeamId(): number | null {
    const teamId = localStorage.getItem('currentTrainingTeamId');
    return teamId ? parseInt(teamId) : null;
  }

  // Limpiar ID del equipo en training
  clearCurrentTrainingTeamId(): void {
    localStorage.removeItem('currentTrainingTeamId');
  }

  // Actualizar nickname de un miembro del equipo
  updateTeamMemberNickname(teamId: number, memberId: number, nickname?: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/teams/${teamId}/members/${memberId}/nickname`,
      { nickname: nickname || null }
    ).pipe(
      tap(() => {
        // Actualizar localmente
        const teams = this.teamsSubject.value;
        const teamIndex = teams.findIndex(t => t.id === teamId);
        if (teamIndex !== -1) {
          const memberIndex = teams[teamIndex].team_members.findIndex(m => m.id === memberId);
          if (memberIndex !== -1) {
            teams[teamIndex].team_members[memberIndex].nickname = nickname;
            this.teamsSubject.next([...teams]);
          }
        }
      }),
      catchError(error => {
        console.error('Error al actualizar nickname:', error);
        throw error;
      })
    );
  }

  // Actualizar nivel de un miembro del equipo
  updateTeamMemberLevel(teamId: number, memberId: number, level: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/teams/${teamId}/members/${memberId}/level`,
      { level }
    ).pipe(
      tap(() => {
        // Actualizar localmente
        const teams = this.teamsSubject.value;
        const teamIndex = teams.findIndex(t => t.id === teamId);
        if (teamIndex !== -1) {
          const memberIndex = teams[teamIndex].team_members.findIndex(m => m.id === memberId);
          if (memberIndex !== -1) {
            teams[teamIndex].team_members[memberIndex].level = level;
            this.teamsSubject.next([...teams]);
          }
        }
      }),
      catchError(error => {
        console.error('Error al actualizar nivel:', error);
        throw error;
      })
    );
  }
}