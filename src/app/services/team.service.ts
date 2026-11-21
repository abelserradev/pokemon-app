import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Pokemon } from './pokemon.service';
import { environment } from '../../environments/environment';
import { TeamPokemonItem } from '../shared/team-pokemon.types';

/** @deprecated Prefer TeamPokemonItem — kept for existing imports. */
export type TeamPokemon = TeamPokemonItem;

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = `${environment.apiUrl}/pokemon`;
  private teamSubject = new BehaviorSubject<TeamPokemonItem[]>([]);
  public team$ = this.teamSubject.asObservable();

  constructor(private http: HttpClient) {}

  clearCache(): void {
    this.teamSubject.next([]);
  }

  loadTeam(): Observable<TeamPokemonItem[]> {
    return this.http.get<TeamPokemonItem[]>(`${this.apiUrl}/team`).pipe(
      tap((team) => {
        this.teamSubject.next(team);
      })
    );
  }

  addToTeam(pokemon: Pokemon, selectedAbility: string, level: number = 50): Observable<TeamPokemonItem> {
    const official = pokemon.sprites?.other?.['official-artwork']?.front_default;
    // Persist artwork separately so GET /team can drive holo cards without re-hitting PokeAPI.
    const teamPokemon = {
      pokemon_id: pokemon.id,
      pokemon_name: pokemon.name,
      pokemon_sprite: pokemon.sprites.front_default || official,
      pokemon_artwork: official || null,
      pokemon_types: pokemon.types?.map((t) => t.type.name),
      selected_ability: selectedAbility,
      level,
      base_stats: {
        hp: pokemon.stats[0].base_stat,
        attack: pokemon.stats[1].base_stat,
        defense: pokemon.stats[2].base_stat,
        'special-attack': pokemon.stats[3].base_stat,
        'special-defense': pokemon.stats[4].base_stat,
        speed: pokemon.stats[5].base_stat
      }
    };

    return this.http.post<TeamPokemonItem>(`${this.apiUrl}/team`, teamPokemon).pipe(
      tap((newPokemon) => {
        const currentTeam = this.teamSubject.value;
        const enrichedPokemon: TeamPokemonItem = {
          ...newPokemon,
          pokemon,
          selectedAbility,
          selected_ability: selectedAbility,
          level
        };
        this.teamSubject.next([...currentTeam, enrichedPokemon]);
      })
    );
  }

  removeFromTeam(teamPokemonId: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/team/${teamPokemonId}`).pipe(
      tap(() => {
        const updatedTeam = this.teamSubject.value.filter((p) => p.id !== teamPokemonId);
        this.teamSubject.next(updatedTeam);
      })
    );
  }

  clearTeam(): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/team/clear-all`).pipe(
      tap(() => {
        this.teamSubject.next([]);
      })
    );
  }

  updateAbility(teamPokemonId: number, ability: string): Observable<TeamPokemonItem> {
    const currentTeam = this.teamSubject.value;
    const index = currentTeam.findIndex((p) => p.id === teamPokemonId);

    if (index === -1) {
      return new Observable((observer) => {
        observer.error(new Error(`No se encontró el Pokémon con ID: ${teamPokemonId}`));
      });
    }

    const updated: TeamPokemonItem = {
      ...currentTeam[index],
      selected_ability: ability,
      selectedAbility: ability
    };
    const next = [...currentTeam];
    next[index] = updated;
    this.teamSubject.next(next);

    return new Observable((observer) => {
      observer.next(updated);
      observer.complete();
    });
  }

  getCurrentTeam(): TeamPokemonItem[] {
    return this.teamSubject.value;
  }
}
