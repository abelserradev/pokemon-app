import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import {
  Pokemon,
  PokemonListResponse,
  PokemonSuggestion
} from '../models/pokemon.model';

export interface CachedPokemon {
  generation: number;
  page: number;
  pokemon: Pokemon[];
  timestamp: number;
}

/** Metadata used to decide whether a full refetch is needed. */
interface CacheMeta {
  /** PokeAPI /pokemon resource count — bumps when new species are added. */
  apiCount: number;
  lastCheckedAt: number;
  version: number;
}

const STORAGE_META = 'poke_cache_meta_v1';
const STORAGE_PAGES = 'poke_cache_pages_v1';
const STORAGE_DETAILS = 'poke_cache_details_v1';
const STORAGE_NAMES = 'poke_cache_names_v1';
const META_VERSION = 1;

@Injectable({
  providedIn: 'root'
})
export class PokemonCacheService {
  private readonly pokeApiBase = 'https://pokeapi.co/api/v2';
  /** Soft TTL: after this we re-check count (cheap), not necessarily refetch pages. */
  private readonly checkIntervalMs = 60 * 60 * 1000; // 1 hour
  /** Soft expiry for in-session page entries when meta cannot be verified. */
  private readonly pageSoftExpiryMs = 30 * 60 * 1000;
  private readonly cache = new Map<string, CachedPokemon>();
  private readonly detailCache = new Map<number, Pokemon>();
  private catalogNames: PokemonSuggestion[] = [];
  private meta: CacheMeta | null = null;
  private freshnessPromise: Promise<boolean> | null = null;

  private currentGenerationSubject = new BehaviorSubject<number>(1);
  private currentPageSubject = new BehaviorSubject<number>(1);

  constructor(private readonly http: HttpClient) {
    this.hydrateFromStorage();
    setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
  }

  /**
   * Lightweight freshness gate: HEAD-equivalent via `GET /pokemon?limit=1`
   * (response body is tiny and includes `count`). Full list/detail refetch
   * only happens when count grows or local data is missing.
   */
  async ensureFreshness(): Promise<boolean> {
    if (this.freshnessPromise) {
      return this.freshnessPromise;
    }

    this.freshnessPromise = this.runFreshnessCheck();
    try {
      return await this.freshnessPromise;
    } finally {
      this.freshnessPromise = null;
    }
  }

  private async runFreshnessCheck(): Promise<boolean> {
    const now = Date.now();
    if (
      this.meta &&
      now - this.meta.lastCheckedAt < this.checkIntervalMs
    ) {
      return true;
    }

    try {
      const probe = await firstValueFrom(
        this.http.get<PokemonListResponse>(`${this.pokeApiBase}/pokemon?limit=1`)
      );
      const remoteCount = probe.count;

      if (this.meta && this.meta.apiCount === remoteCount) {
        // Same catalog size → cached pages/details remain valid; only bump check time.
        this.meta = {
          ...this.meta,
          lastCheckedAt: now
        };
        this.persistMeta();
        return true;
      }

      // WHY invalidate: PokeAPI count increased (or first visit) → new species exist.
      if (this.meta && this.meta.apiCount !== remoteCount) {
        this.invalidateForNewCatalog(remoteCount, now);
      } else {
        this.meta = {
          apiCount: remoteCount,
          lastCheckedAt: now,
          version: META_VERSION
        };
        this.persistMeta();
      }
      return true;
    } catch {
      // Offline / API down: keep serving durable cache if present.
      return this.meta !== null || this.cache.size > 0;
    }
  }

  getKnownApiCount(): number | null {
    return this.meta?.apiCount ?? null;
  }

  private getCacheKey(generation: number, page: number): string {
    return `gen${generation}_page${page}`;
  }

  setPokemon(generation: number, page: number, pokemon: Pokemon[]): void {
    const key = this.getCacheKey(generation, page);
    const entry: CachedPokemon = {
      generation,
      page,
      pokemon,
      timestamp: Date.now()
    };
    this.cache.set(key, entry);
    pokemon.forEach((p) => this.setDetail(p));
    this.persistPages();
  }

  getPokemon(generation: number, page: number): Pokemon[] | null {
    const key = this.getCacheKey(generation, page);
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }
    // Verified apiCount ⇒ pages stay valid; without meta, soft TTL still applies.
    if (this.meta || !this.isSoftExpired(cached.timestamp)) {
      return cached.pokemon;
    }
    return null;
  }

  hasPokemon(generation: number, page: number): boolean {
    return this.getPokemon(generation, page) !== null;
  }

  setDetail(pokemon: Pokemon): void {
    this.detailCache.set(pokemon.id, pokemon);
    this.persistDetails();
  }

  getDetail(id: number): Pokemon | null {
    return this.detailCache.get(id) ?? null;
  }

  getDetailByName(name: string): Pokemon | null {
    const normalized = name.toLowerCase().trim();
    for (const pokemon of this.detailCache.values()) {
      if (pokemon.name === normalized) {
        return pokemon;
      }
    }
    return null;
  }

  setCatalogNames(names: PokemonSuggestion[]): void {
    this.catalogNames = names;
    this.persistNames();
  }

  getCatalogNames(): PokemonSuggestion[] {
    return this.catalogNames;
  }

  private isSoftExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.pageSoftExpiryMs;
  }

  private cleanExpiredCache(): void {
    if (this.meta) {
      return;
    }
    for (const [key, cached] of this.cache.entries()) {
      if (this.isSoftExpired(cached.timestamp)) {
        this.cache.delete(key);
      }
    }
    this.persistPages();
  }

  getCacheStats(): { size: number; keys: string[]; detailSize: number; apiCount: number | null } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      detailSize: this.detailCache.size,
      apiCount: this.getKnownApiCount()
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.detailCache.clear();
    this.catalogNames = [];
    this.meta = null;
    this.removeStorage(STORAGE_PAGES);
    this.removeStorage(STORAGE_DETAILS);
    this.removeStorage(STORAGE_NAMES);
    this.removeStorage(STORAGE_META);
  }

  /**
   * New PokeAPI count means new species IDs may exist — drop list/catalog so
   * /pokemon refetches those pages. Keep per-id details for old IDs (immutable).
   */
  private invalidateForNewCatalog(remoteCount: number, checkedAt: number): void {
    this.cache.clear();
    this.catalogNames = [];
    this.removeStorage(STORAGE_PAGES);
    this.removeStorage(STORAGE_NAMES);
    this.meta = {
      apiCount: remoteCount,
      lastCheckedAt: checkedAt,
      version: META_VERSION
    };
    this.persistMeta();
  }

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

  private hydrateFromStorage(): void {
    this.meta = this.readJson<CacheMeta>(STORAGE_META);
    if (this.meta && this.meta.version !== META_VERSION) {
      this.clearCache();
      return;
    }

    const pages = this.readJson<Record<string, CachedPokemon>>(STORAGE_PAGES);
    if (pages) {
      Object.entries(pages).forEach(([key, entry]) => this.cache.set(key, entry));
    }

    const details = this.readJson<Record<string, Pokemon>>(STORAGE_DETAILS);
    if (details) {
      Object.entries(details).forEach(([id, pokemon]) => {
        this.detailCache.set(Number(id), pokemon);
      });
    }

    const names = this.readJson<PokemonSuggestion[]>(STORAGE_NAMES);
    if (names?.length) {
      this.catalogNames = names;
    }
  }

  private persistMeta(): void {
    this.writeJson(STORAGE_META, this.meta);
  }

  private persistPages(): void {
    const payload: Record<string, CachedPokemon> = {};
    this.cache.forEach((value, key) => {
      payload[key] = value;
    });
    this.writeJson(STORAGE_PAGES, payload);
  }

  private persistDetails(): void {
    const payload: Record<string, Pokemon> = {};
    this.detailCache.forEach((value, id) => {
      payload[String(id)] = value;
    });
    this.writeJson(STORAGE_DETAILS, payload);
  }

  private persistNames(): void {
    this.writeJson(STORAGE_NAMES, this.catalogNames);
  }

  private readJson<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private writeJson(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // QuotaExceeded or private mode — keep in-memory cache only.
    }
  }

  private removeStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
