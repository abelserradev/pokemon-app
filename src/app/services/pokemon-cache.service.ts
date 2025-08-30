import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Pokemon } from './pokemon.service';

export interface CachedPokemon {
  generation: number;
  page: number;
  pokemon: Pokemon[];
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonCacheService {
  private cache = new Map<string, CachedPokemon>();
  private cacheExpiry = 30 * 60 * 1000; // 30 minutos
  private currentGenerationSubject = new BehaviorSubject<number>(1);
  private currentPageSubject = new BehaviorSubject<number>(1);

  constructor() {
    // Limpiar caché expirado cada 5 minutos
    setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
  }

  // Generar clave única para caché
  private getCacheKey(generation: number, page: number): string {
    return `gen${generation}_page${page}`;
  }

  // Guardar Pokemon en caché
  setPokemon(generation: number, page: number, pokemon: Pokemon[]): void {
    const key = this.getCacheKey(generation, page);
    this.cache.set(key, {
      generation,
      page,
      pokemon,
      timestamp: Date.now()
    });
  }

  // Obtener Pokemon del caché
  getPokemon(generation: number, page: number): Pokemon[] | null {
    const key = this.getCacheKey(generation, page);
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.pokemon;
    }

    return null;
  }

  // Verificar si existe en caché
  hasPokemon(generation: number, page: number): boolean {
    return this.getPokemon(generation, page) !== null;
  }

  // Verificar si el caché está expirado
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.cacheExpiry;
  }

  // Limpiar caché expirado
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (this.isExpired(cached.timestamp)) {
        this.cache.delete(key);
      }
    }
  }

  // Obtener estadísticas del caché
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Limpiar todo el caché
  clearCache(): void {
    this.cache.clear();
  }

  // Observables para el estado actual
  getCurrentGeneration(): Observable<number> {
    return this.currentGenerationSubject.asObservable();
  }

  getCurrentPage(): Observable<number> {
    return this.currentPageSubject.asObservable();
  }

  setCurrentGeneration(generation: number): void {
    this.currentGenerationSubject.next(generation);
  }

  setCurrentPage(page: number): void {
    this.currentPageSubject.next(page);
  }
}
