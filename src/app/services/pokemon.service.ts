import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { PokemonCacheService } from './pokemon-cache.service';
import {
  Pokemon,
  PokemonListResponse,
  PokemonSuggestion
} from '../models/pokemon.model';

export type { Pokemon, PokemonListResponse, PokemonSuggestion } from '../models/pokemon.model';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private baseUrl = 'https://pokeapi.co/api/v2';
  private cache = new Map<number, Observable<Pokemon>>();
  private catalogLoadStarted = false;

  constructor(
    private http: HttpClient,
    private pokemonCache: PokemonCacheService
  ) {
    void this.bootstrapCatalog();
  }

  /**
   * Prefer durable catalog when PokeAPI `count` is unchanged; only pull the
   * full name list when the catalog is missing or new species appeared.
   */
  private async bootstrapCatalog(): Promise<void> {
    if (this.catalogLoadStarted) {
      return;
    }
    this.catalogLoadStarted = true;

    await this.pokemonCache.ensureFreshness();
    const cachedNames = this.pokemonCache.getCatalogNames();
    if (cachedNames.length > 0) {
      return;
    }

    this.loadAllPokemonNames();
  }

  private loadAllPokemonNames(): void {
    const knownCount = this.pokemonCache.getKnownApiCount();
    const limit = knownCount && knownCount > 0 ? knownCount : 1025;

    this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon?limit=${limit}`).subscribe({
      next: (response) => {
        const names = response.results.map((pokemon, index) => ({
          name: pokemon.name,
          id: index + 1
        }));
        this.pokemonCache.setCatalogNames(names);
      },
      error: () => {
        // Search stays empty until a later successful refresh.
      }
    });
  }

  getPokemonById(id: number): Observable<Pokemon> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const durable = this.pokemonCache.getDetail(id);
    if (durable) {
      const cached$ = of(durable).pipe(shareReplay(1));
      this.cache.set(id, cached$);
      return cached$;
    }

    const request = this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${id}`).pipe(
      tap((pokemon) => this.pokemonCache.setDetail(pokemon)),
      shareReplay(1)
    );
    this.cache.set(id, request);
    return request;
  }

  getPokemonByName(name: string): Observable<Pokemon> {
    const durable = this.pokemonCache.getDetailByName(name);
    if (durable) {
      if (!this.cache.has(durable.id)) {
        this.cache.set(durable.id, of(durable).pipe(shareReplay(1)));
      }
      return of(durable);
    }

    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${name}`).pipe(
      tap((pokemon) => {
        this.pokemonCache.setDetail(pokemon);
        this.cache.set(pokemon.id, of(pokemon).pipe(shareReplay(1)));
      })
    );
  }

  clearCache(): void {
    this.cache.clear();
    this.pokemonCache.clearCache();
    this.catalogLoadStarted = false;
  }

  searchPokemon(query: string, limit: number = 10): PokemonSuggestion[] {
    if (!query || query.length < 2) return [];

    const allPokemonNames = this.pokemonCache.getCatalogNames();
    const normalizedQuery = query.toLowerCase().trim();

    const results = allPokemonNames
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
    if (str1.startsWith(str2)) return 100;
    if (str1.includes(str2)) return 80;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = ((maxLength - distance) / maxLength) * 60;
    return similarity > 40 ? similarity : 0;
  }

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
