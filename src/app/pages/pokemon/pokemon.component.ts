import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { firstValueFrom, catchError, of, Subscription } from 'rxjs';
import { PokemonService, Pokemon, PokemonSuggestion } from '../../services/pokemon.service';
import { PokemonCacheService } from '../../services/pokemon-cache.service';
import { LoadingService, LoadingState } from '../../services/loading.service';
import { LoadingComponent } from '../../components/loading/loading';
import { FavoritesService } from '../../services/favorites.service';


@Component({
  selector: 'app-pokemon',
  standalone: true,
  imports: [CommonModule, AsyncPipe, LoadingComponent, FormsModule],
  templateUrl: './pokemon.html',
  styleUrl: './pokemon.scss'
})

export class PokemonComponent implements OnInit, OnDestroy {
  generations = [
    { number: 1, name: 'Gen 1', start: 1, end: 151 },
    { number: 2, name: 'Gen 2', start: 152, end: 251 },
    { number: 3, name: 'Gen 3', start: 252, end: 386 },
    { number: 4, name: 'Gen 4', start: 387, end: 493 },
    { number: 5, name: 'Gen 5', start: 494, end: 649 },
    { number: 6, name: 'Gen 6', start: 650, end: 721 },
    { number: 7, name: 'Gen 7', start: 722, end: 809 },
    { number: 8, name: 'Gen 8', start: 810, end: 898 },
    { number: 9, name: 'Gen 9', start: 899, end: 1025 }
  ];

  selectedGeneration = 1;
  currentPage = 1;
  pokemonList: Pokemon[] = [];
  loading = false;
  error: string | null = null;
  totalPages = 0;
  pokemonPerPage = 20;
  loadingState$!: Observable<LoadingState>;
  isDropdownOpen = false;
  private subscriptions = new Subscription();
  searchQuery = '';
  searchSuggestions: PokemonSuggestion[] = [];
  showSuggestions = false;
  searchedPokemon: Pokemon | null = null;
  isSearchMode = false;

  constructor(
    private pokemonService: PokemonService,
    private cacheService: PokemonCacheService,
    private loadingService: LoadingService,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.loadingState$ = this.loadingService.loading$;

    // Suscribirse a cambios de generación y página
    this.subscriptions.add(
      this.cacheService.getCurrentGeneration().subscribe(gen => {
        if (gen !== this.selectedGeneration) {
          this.selectedGeneration = gen;
          this.currentPage = 1;
          this.loadPokemon();
        }
      })
    );

    this.subscriptions.add(
      this.cacheService.getCurrentPage().subscribe(page => {
        if (page !== this.currentPage) {
          this.currentPage = page;
          this.loadPokemon();
        }
      })
    );

    // Cargar datos iniciales
    this.loadPokemon();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Método para generar el array de páginas
  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  async selectGeneration(generation: number): Promise<void> {
    this.selectedGeneration = generation;
    this.currentPage = 1;
    this.isDropdownOpen = false;
    this.cacheService.setCurrentGeneration(generation);
    this.cacheService.setCurrentPage(1);
    await this.loadPokemon();
  }

  async changePage(page: number): Promise<void> {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cacheService.setCurrentPage(page);
      await this.loadPokemon();
    }
  }

  private async loadPokemon(): Promise<void> {
    const gen = this.generations.find(g => g.number === this.selectedGeneration);
    if (!gen) return;

    // Verificar si existe en caché
    if (this.cacheService.hasPokemon(this.selectedGeneration, this.currentPage)) {
      this.pokemonList = this.cacheService.getPokemon(this.selectedGeneration, this.currentPage)!;
      this.calculateTotalPages(gen.end - gen.start + 1);
      return;
    }

    this.loading = true;
    this.error = null;
    this.loadingService.show('Cargando Pokemon...', '¡Explorando la generación ' + this.selectedGeneration + '!', false);

    try {
      const startId = gen.start + (this.currentPage - 1) * this.pokemonPerPage;
      const endId = Math.min(startId + this.pokemonPerPage - 1, gen.end);

      const pokemonIds = Array.from(
        { length: endId - startId + 1 },
        (_, i) => startId + i
      );

      const pokemonPromises = pokemonIds.map(id =>
        firstValueFrom(
          this.pokemonService.getPokemonById(id).pipe(
            catchError(() => of(null))
          )
        )
      );

      const results = await Promise.all(pokemonPromises);
      this.pokemonList = results.filter(p => p !== null) as Pokemon[];

      // Guardar en caché
      this.cacheService.setPokemon(this.selectedGeneration, this.currentPage, this.pokemonList);

      this.calculateTotalPages(gen.end - gen.start + 1);

      // Trackear los primeros 3 Pokémon visibles
      this.trackVisiblePokemon();
    } catch (error) {
      this.error = 'Error al cargar los Pokemon';
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }
  onSearchInput(): void {
    if (this.searchQuery.length < 2) {
      this.searchSuggestions = [];
      this.showSuggestions = false;
      return;
    }

    this.searchSuggestions = this.pokemonService.searchPokemon(this.searchQuery, 8);
    this.showSuggestions = this.searchSuggestions.length > 0;
  }

  // Seleccionar un pokémon de las sugerencias
  async selectSuggestion(suggestion: PokemonSuggestion): Promise<void> {
    this.searchQuery = suggestion.name;
    this.showSuggestions = false;
    await this.searchPokemon();
  }

  // Buscar pokémon específico
  async searchPokemon(): Promise<void> {
    if (!this.searchQuery || this.searchQuery.length < 2) {
      this.clearSearch();
      return;
    }

    this.loading = true;
    this.error = null;
    this.loadingService.show('Buscando Pokémon...', '¡Rastreando a ' + this.searchQuery + '!', false);

    try {
      const pokemon = await firstValueFrom(
        this.pokemonService.getPokemonByName(this.searchQuery.toLowerCase()).pipe(
          catchError(() => of(null))
        )
      );

      if (pokemon) {
        this.searchedPokemon = pokemon;
        this.isSearchMode = true;
        this.showSuggestions = false;

        // Trackear búsqueda
        const pokemonData = {
          pokemon_id: pokemon.id,
          pokemon_name: pokemon.name,
          pokemon_sprite: pokemon.sprites?.front_default || pokemon.sprites?.other?.['official-artwork']?.front_default,
          pokemon_types: pokemon.types?.map(t => t.type.name) || []
        };

        this.favoritesService.trackPokemonSearch(pokemonData).subscribe({
          error: () => {}
        });
      } else {
        this.error = 'No se encontró el Pokémon. Intenta con otro nombre.';
      }
    } catch (error) {
      this.error = 'Error al buscar el Pokémon';
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  // Limpiar búsqueda y volver al modo normal
  clearSearch(): void {
    this.searchQuery = '';
    this.searchedPokemon = null;
    this.searchSuggestions = [];
    this.showSuggestions = false;
    this.isSearchMode = false;
    this.error = null;
  }

  // Manejar Enter en el input de búsqueda
  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.searchPokemon();
    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }

  // Cerrar sugerencias al hacer click fuera
  closeSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  private trackVisiblePokemon(): void {
    // Trackear solo los primeros 3 Pokémon de la página actual
    const pokemonToTrack = this.pokemonList.slice(0, 3);

    pokemonToTrack.forEach(pokemon => {
      if (!pokemon) return;

      const pokemonData = {
        pokemon_id: pokemon.id,
        pokemon_name: pokemon.name,
        pokemon_sprite: pokemon.sprites?.front_default || pokemon.sprites?.other?.['official-artwork']?.front_default,
        pokemon_types: pokemon.types?.map(t => t.type.name) || []
      };

      this.favoritesService.trackPokemonSearch(pokemonData).subscribe({
        error: () => {}
      });
    });
  }

  private calculateTotalPages(totalPokemon: number): void {
    this.totalPages = Math.ceil(totalPokemon / this.pokemonPerPage);
  }

  getStatName(statName: string): string {
    const statNames: { [key: string]: string } = {
      'hp': 'HP',
      'attack': 'Ataque',
      'defense': 'Defensa',
      'special-attack': 'Ataque Especial',
      'special-defense': 'Defensa Especial',
      'speed': 'Velocidad'
    };
    return statNames[statName] || statName;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  getCurrentGenerationName(): string {
    const currentGen = this.generations.find(gen => gen.number === this.selectedGeneration);
    return currentGen ? currentGen.name : 'Gen 1';
  }
}
