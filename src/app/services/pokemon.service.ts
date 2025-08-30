import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface Pokemon {
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
    type: {
      name: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
    };
    is_hidden: boolean;
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    name: string;
    url: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private baseUrl = 'https://pokeapi.co/api/v2';
  private cache = new Map<number, Observable<Pokemon>>();

  constructor(private http: HttpClient) {}

  // Obtener pokemon por ID con cache
  getPokemonById(id: number): Observable<Pokemon> {
    if (!this.cache.has(id)) {
      const request = this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${id}`).pipe(
        shareReplay(1) // Cache la respuesta para futuras suscripciones
      );
      this.cache.set(id, request);
    }
    return this.cache.get(id)!;
  }

  // Obtener pokemon por nombre
  getPokemonByName(name: string): Observable<Pokemon> {
    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${name}`);
  }

  // Limpiar cache si es necesario
  clearCache() {
    this.cache.clear();
  }
}
