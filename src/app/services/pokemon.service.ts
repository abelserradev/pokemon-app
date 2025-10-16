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


export interface PokemonSuggestion {
  name: string;
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private baseUrl = 'https://pokeapi.co/api/v2';
  private cache = new Map<number, Observable<Pokemon>>();
  private allPokemonNames: PokemonSuggestion[] = [];

  constructor(private http: HttpClient) {this.loadAllPokemonNames();}

  private loadAllPokemonNames(): void {
    this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon?limit=1025`).subscribe({
      next: (response) => {
        this.allPokemonNames = response.results.map((pokemon, index) => ({
          name: pokemon.name,
          id: index + 1
        }));
      },
      error: (error) => console.error('Error loading pokemon names:', error)
    });
  }

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
  searchPokemon(query: string, limit: number = 10): PokemonSuggestion[] {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();

    // Calcular similitud usando distancia de Levenshtein simplificada
    const results = this.allPokemonNames
      .map(pokemon => ({
        ...pokemon,
        score: this.calculateSimilarity(pokemon.name, normalizedQuery)
      }))
      .filter(pokemon => pokemon.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Si empieza igual, máxima prioridad
    if (str1.startsWith(str2)) return 100;

    // Si contiene la búsqueda, alta prioridad
    if (str1.includes(str2)) return 80;

    // Calcular distancia de edición
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    // Convertir distancia a score (0-100)
    const similarity = ((maxLength - distance) / maxLength) * 60;

    // Solo devolver si la similitud es mayor a 40%
    return similarity > 40 ? similarity : 0;
  }

  // Distancia de Levenshtein
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

}
