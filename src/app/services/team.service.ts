import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Pokemon } from './pokemon.service';

export interface TeamPokemon {
  id?: number;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite: string;
  selected_ability: string;
  added_at?: string;
  pokemon?: Pokemon;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = 'http://localhost:8000/api/pokemon';
  private teamSubject = new BehaviorSubject<any[]>([]);
  public team$ = this.teamSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadTeam(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/team`).pipe(
      tap(team => {
        console.log('Equipo cargado:', team);
        this.teamSubject.next(team);
      })
    );
  }

  addToTeam(pokemon: Pokemon, selectedAbility: string): Observable<any> {
    const teamPokemon = {
      pokemon_id: pokemon.id,
      pokemon_name: pokemon.name,
      pokemon_sprite: pokemon.sprites.front_default || pokemon.sprites?.other?.['official-artwork']?.front_default,
      pokemon_types: pokemon.types?.map((t: any) => t.type.name), // Tipos del pokémon
      selected_ability: selectedAbility,
      level: 1,
      base_stats: {
        hp: pokemon.stats[0].base_stat,
        attack: pokemon.stats[1].base_stat,
        defense: pokemon.stats[2].base_stat,
        'special-attack': pokemon.stats[3].base_stat,
        'special-defense': pokemon.stats[4].base_stat,
        speed: pokemon.stats[5].base_stat
      }
    };

    console.log('Enviando pokémon al backend:', teamPokemon);

    return this.http.post<any>(`${this.apiUrl}/team`, teamPokemon).pipe(
      tap(newPokemon => {
        console.log('Pokémon agregado por backend:', newPokemon);
        const currentTeam = this.teamSubject.value;
        const enrichedPokemon = {
          ...newPokemon,
          pokemon: pokemon,
          selectedAbility: selectedAbility
        };
        this.teamSubject.next([...currentTeam, enrichedPokemon]);
      })
    );
  }

  removeFromTeam(teamPokemonId: number): Observable<any> {
    console.log('Servicio: Eliminando pokémon con ID de BD:', teamPokemonId);

    return this.http.delete(`${this.apiUrl}/team/${teamPokemonId}`).pipe(
      tap(() => {
        console.log('DELETE exitoso, actualizando estado local');
        const currentTeam = this.teamSubject.value;
        const updatedTeam = currentTeam.filter(p => p.id !== teamPokemonId);
        console.log('Equipo actualizado:', updatedTeam);
        this.teamSubject.next(updatedTeam);
      })
    );
  }

  updateAbility(pokemonId: number, ability: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/team/${pokemonId}/ability`, { ability }).pipe(
      tap(updatedPokemon => {
        const currentTeam = this.teamSubject.value;
        const index = currentTeam.findIndex(p => p.pokemon_id === pokemonId);
        if (index !== -1) {
          currentTeam[index] = {
            ...currentTeam[index],
            selected_ability: ability,
            selectedAbility: ability
          };
          this.teamSubject.next([...currentTeam]);
        }
      })
    );
  }

  getCurrentTeam(): any[] {
    return this.teamSubject.value;
  }
}
