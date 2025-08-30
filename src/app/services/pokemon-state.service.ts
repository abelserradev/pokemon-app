import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Pokemon } from './pokemon.service';

export interface PokemonState {
  selectedGeneration: number;
  currentPage: number;
  pokemonList: Pokemon[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalPokemonInGeneration: number;
  loadedPages: Set<number>; // Para trackear qué páginas ya están cargadas
}

@Injectable({
  providedIn: 'root'
})
export class PokemonStateService {
  private initialState: PokemonState = {
    selectedGeneration: 1,
    currentPage: 1,
    pokemonList: [],
    loading: false,
    error: null,
    totalPages: 1,
    totalPokemonInGeneration: 0,
    loadedPages: new Set()
  };

  private stateSubject = new BehaviorSubject<PokemonState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  // Getters para acceder al estado actual
  get currentState(): PokemonState {
    return this.stateSubject.value;
  }

  // Actualizar estado
  private updateState(updates: Partial<PokemonState>) {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...updates };
    this.stateSubject.next(newState);
  }

  // Métodos para manejar el estado
  setLoading(loading: boolean) {
    this.updateState({ loading, error: null });
  }

  setError(error: string) {
    this.updateState({ error, loading: false });
  }

  setGeneration(generation: number) {
    this.updateState({
      selectedGeneration: generation,
      currentPage: 1,
      pokemonList: [],
      totalPages: 1,
      totalPokemonInGeneration: 0,
      loadedPages: new Set(),
      error: null
    });
  }

  setPage(page: number) {
    this.updateState({ currentPage: page });
  }

  setPokemonList(pokemonList: Pokemon[]) {
    this.updateState({ pokemonList, loading: false });
  }

  setTotalPages(totalPages: number) {
    this.updateState({ totalPages });
  }

  setTotalPokemonInGeneration(total: number) {
    this.updateState({ totalPokemonInGeneration: total });
  }

  addLoadedPage(page: number) {
    const currentState = this.stateSubject.value;
    const newLoadedPages = new Set(currentState.loadedPages);
    newLoadedPages.add(page);
    this.updateState({ loadedPages: newLoadedPages });
  }

  isPageLoaded(page: number): boolean {
    return this.currentState.loadedPages.has(page);
  }

  // Cache de Pokemon por página
  private pokemonCache = new Map<string, Pokemon[]>();

  cachePokemonForPage(generation: number, page: number, pokemonList: Pokemon[]) {
    const key = `${generation}-${page}`;
    this.pokemonCache.set(key, pokemonList);
  }

  getCachedPokemon(generation: number, page: number): Pokemon[] | undefined {
    const key = `${generation}-${page}`;
    return this.pokemonCache.get(key);
  }

  clearCache() {
    this.pokemonCache.clear();
  }
}
