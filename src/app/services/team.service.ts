import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Pokemon } from './pokemon.service';
import { environment } from '../../environments/environment';

export interface TeamPokemon {
  id?: number;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite: string;
  selected_ability: string;
  nickname?: string;
  level?: number;
  added_at?: string;
  pokemon?: Pokemon;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = `${environment.apiUrl}/pokemon`;
  private teamSubject = new BehaviorSubject<any[]>([]);
  public team$ = this.teamSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Limpiar cache y forzar recarga
  clearCache(): void {
    this.teamSubject.next([]);
  }

  loadTeam(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/team`).pipe(
      tap(team => {
        this.teamSubject.next(team);
      })
    );
  }

  addToTeam(pokemon: Pokemon, selectedAbility: string, level: number = 50): Observable<any> {
    const teamPokemon = {
      pokemon_id: pokemon.id,
      pokemon_name: pokemon.name,
      pokemon_sprite: pokemon.sprites.front_default || pokemon.sprites?.other?.['official-artwork']?.front_default,
      pokemon_types: pokemon.types?.map((t: any) => t.type.name),
      selected_ability: selectedAbility,
      level: level,  // Usar el nivel proporcionado
      base_stats: {
        hp: pokemon.stats[0].base_stat,
        attack: pokemon.stats[1].base_stat,
        defense: pokemon.stats[2].base_stat,
        'special-attack': pokemon.stats[3].base_stat,
        'special-defense': pokemon.stats[4].base_stat,
        speed: pokemon.stats[5].base_stat
      }
    };

    return this.http.post<any>(`${this.apiUrl}/team`, teamPokemon).pipe(
      tap(newPokemon => {
        const currentTeam = this.teamSubject.value;
        const enrichedPokemon = {
          ...newPokemon,
          pokemon: pokemon,
          selectedAbility: selectedAbility,
          level: level
        };
        this.teamSubject.next([...currentTeam, enrichedPokemon]);
      })
    );
  }

  removeFromTeam(teamPokemonId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/team/${teamPokemonId}`).pipe(
      tap(() => {
        const currentTeam = this.teamSubject.value;
        const updatedTeam = currentTeam.filter(p => p.id !== teamPokemonId);
        this.teamSubject.next(updatedTeam);
      })
    );
  }

  // Limpiar todo el equipo actual
  clearTeam(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/team/clear-all`).pipe(
      tap(() => {
        this.teamSubject.next([]);
      })
    );
  }

  updateAbility(teamPokemonId: number, ability: string): Observable<any> {
    const currentTeam = this.teamSubject.value;
    const index = currentTeam.findIndex(p => p.id === teamPokemonId);

    if (index !== -1) {
      currentTeam[index] = {
        ...currentTeam[index],
        selected_ability: ability,
        selectedAbility: ability
      };
      this.teamSubject.next([...currentTeam]);

      return new Observable(observer => {
        observer.next(currentTeam[index]);
        observer.complete();
      });
    } else {
      return new Observable(observer => {
        observer.error(new Error(`No se encontró el Pokémon con ID: ${teamPokemonId}`));
      });
    }
  }

  getCurrentTeam(): any[] {
    return this.teamSubject.value;
  }
}
