import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, AsyncPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom, catchError, of } from 'rxjs';
import { PokemonService, Pokemon, PokemonSuggestion } from '../../services/pokemon.service';
import { LoadingService, LoadingState } from '../../services/loading.service';
import { ModalService } from '../../services/modal.service';
import { LoadingComponent } from '../../components/loading/loading';
import { HoloPokemonCardComponent } from '../../components/holo-pokemon-card/holo-pokemon-card';
import { TeamService } from '../../services/team.service';
import { TrainingService } from '../../services/training.service';
import { FavoritesService } from '../../services/favorites.service';
import { PokemonTeamsService } from '../../services/pokemon-team-service';
import { Router } from '@angular/router';
import { TeamPokemonItem } from '../../shared/team-pokemon.types';
import {
  resolveArtworkFromTeamItem,
  resolvePokemonArtwork,
  typeNamesFromPokemon,
  typeNamesFromTeamItem
} from '../../shared/pokemon-artwork';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AsyncPipe,
    TitleCasePipe,
    LoadingComponent,
    HoloPokemonCardComponent
  ],
  templateUrl: './team.html',
  styleUrl: './team.scss'
})
export class Team implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  searchTerm = '';
  searchedPokemon: Pokemon | null = null;
  teamPokemon: TeamPokemonItem[] = [];
  loading = false;
  adding = false;
  error: string | null = null;
  maxTeamSize = 6;
  loadingState$!: Observable<LoadingState>;
  private pokemonCache = new Map<number, Pokemon>();

  searchSuggestions: PokemonSuggestion[] = [];
  showSuggestions = false;
  activeSuggestionIndex = -1;
  pokemonLevel = 50;

  constructor(
    private pokemonService: PokemonService,
    private loadingService: LoadingService,
    private modalService: ModalService,
    private teamService: TeamService,
    private trainingService: TrainingService,
    private favoritesService: FavoritesService,
    private teamsService: PokemonTeamsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadingState$ = this.loadingService.loading$;
    this.loadTeamFromBackend();

    this.teamService.team$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((team) => {
      this.teamPokemon = team;
      void this.enrichTeamWithPokemonData();
    });
  }

  artworkForSearch(pokemon: Pokemon): string {
    return resolvePokemonArtwork({ pokemon });
  }

  artworkForMember(item: TeamPokemonItem): string {
    return resolveArtworkFromTeamItem(item);
  }

  typesForSearch(pokemon: Pokemon): string[] {
    return typeNamesFromPokemon(pokemon);
  }

  typesForMember(item: TeamPokemonItem): string[] {
    return typeNamesFromTeamItem(item);
  }

  isAlreadyInTeam(pokemonId: number): boolean {
    return this.teamPokemon.some((p) => p.pokemon_id === pokemonId);
  }

  get canAddSearched(): boolean {
    if (!this.searchedPokemon || this.adding) {
      return false;
    }
    if (this.teamPokemon.length >= this.maxTeamSize) {
      return false;
    }
    return !this.isAlreadyInTeam(this.searchedPokemon.id);
  }

  get addButtonLabel(): string {
    if (!this.searchedPokemon) {
      return 'Agregar al Equipo';
    }
    if (this.adding) {
      return 'Agregando…';
    }
    if (this.teamPokemon.length >= this.maxTeamSize) {
      return 'Equipo Lleno';
    }
    if (this.isAlreadyInTeam(this.searchedPokemon.id)) {
      return 'Ya en el equipo';
    }
    return 'Agregar al Equipo';
  }

  private async enrichTeamWithPokemonData(): Promise<void> {
    for (const teamPoke of this.teamPokemon) {
      if (teamPoke.pokemon) {
        continue;
      }

      let pokemon = this.pokemonCache.get(teamPoke.pokemon_id);
      if (!pokemon) {
        const result = await firstValueFrom(
          this.pokemonService.getPokemonById(teamPoke.pokemon_id).pipe(catchError(() => of(undefined)))
        );
        if (result) {
          pokemon = result;
          this.pokemonCache.set(teamPoke.pokemon_id, pokemon);
        }
      }

      if (pokemon) {
        teamPoke.pokemon = pokemon;
        teamPoke.selectedAbility = teamPoke.selected_ability;
      }
    }
  }

  private loadTeamFromBackend(): void {
    this.teamService
      .loadTeam()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: { status?: number }) => {
          if (error.status === 401) {
            this.router.navigate(['/login']);
          } else {
            this.error = 'Error al cargar el equipo. Por favor intenta de nuevo.';
          }
        }
      });
  }

  async searchPokemon(): Promise<void> {
    if (!this.searchTerm.trim()) {
      this.error = 'Por favor ingresa el nombre de un Pokemon';
      this.searchedPokemon = null;
      return;
    }

    this.loading = true;
    this.error = null;
    this.showSuggestions = false;
    this.loadingService.showSearch();

    try {
      const result = await firstValueFrom(
        this.pokemonService.getPokemonByName(this.searchTerm.toLowerCase()).pipe(catchError(() => of(undefined)))
      );

      if (result) {
        this.searchedPokemon = result;
        this.error = null;
      } else {
        this.searchedPokemon = null;
        this.error = `No se encontró el Pokemon "${this.searchTerm}". Prueba con otro nombre o elige una sugerencia.`;
      }
    } catch {
      this.searchedPokemon = null;
      this.error = 'Error al buscar el Pokemon. Revisa tu conexión e intenta de nuevo.';
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  addToTeam(): void {
    if (!this.searchedPokemon || !this.canAddSearched) {
      return;
    }

    if (this.pokemonLevel < 1 || this.pokemonLevel > 100) {
      this.modalService.showWarning('El nivel debe estar entre 1 y 100', 'Nivel Inválido');
      return;
    }

    const selectedAbility = this.searchedPokemon.abilities[0]?.ability.name || '';
    const pokemon = this.searchedPokemon;
    const currentLevel = this.pokemonLevel;
    this.adding = true;

    this.teamService
      .addToTeam(pokemon, selectedAbility, currentLevel)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.favoritesService
            .trackPokemonSearch({
              pokemon_id: pokemon.id,
              pokemon_name: pokemon.name,
              pokemon_sprite: pokemon.sprites?.front_default,
              pokemon_types: pokemon.types?.map((t) => t.type.name)
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => {} });

          this.error = null;
          this.searchedPokemon = null;
          this.searchTerm = '';
          this.adding = false;
          this.modalService.showSuccess(
            `${pokemon.name} (Nivel ${currentLevel}) fue agregado al equipo`,
            '¡Pokémon Agregado!'
          );
          this.pokemonLevel = 50;
        },
        error: (error: { error?: { detail?: string } }) => {
          this.adding = false;
          const errorMsg = error.error?.detail || 'Error al agregar el pokémon al equipo';
          this.error = errorMsg;
          this.modalService.showError(errorMsg, 'Error');
        }
      });
  }

  removeFromTeam(teamPokemonId: number): void {
    const pokemonToRemove = this.teamPokemon.find((p) => p.id === teamPokemonId);

    this.teamService
      .removeFromTeam(teamPokemonId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.error = null;
          if (pokemonToRemove) {
            this.trainingService
              .resetTrainingForPokemon(pokemonToRemove.pokemon_id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({ error: () => {} });
          }
          this.favoritesService.loadSmartFavorites(5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        },
        error: (error: { error?: { detail?: string } }) => {
          this.error = error.error?.detail || 'Error al eliminar el pokémon del equipo';
        }
      });
  }

  onAbilityChange(teamPokemonId: number | undefined, abilityName: string | undefined): void {
    if (teamPokemonId == null || !abilityName) {
      return;
    }
    this.teamService
      .updateAbility(teamPokemonId, abilityName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.error = null;
        },
        error: (error: Error) => {
          this.error = error.message || 'Error al actualizar la habilidad';
        }
      });
  }

  onSearchInput(): void {
    this.activeSuggestionIndex = -1;
    if (this.searchTerm.length < 2) {
      this.searchSuggestions = [];
      this.showSuggestions = false;
      return;
    }
    this.searchSuggestions = this.pokemonService.searchPokemon(this.searchTerm, 8);
    this.showSuggestions = this.searchSuggestions.length > 0;
  }

  async selectSuggestion(suggestion: PokemonSuggestion): Promise<void> {
    this.searchTerm = suggestion.name;
    this.showSuggestions = false;
    this.activeSuggestionIndex = -1;
    await this.searchPokemon();
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && this.showSuggestions) {
      event.preventDefault();
      this.activeSuggestionIndex = Math.min(
        this.activeSuggestionIndex + 1,
        this.searchSuggestions.length - 1
      );
      return;
    }
    if (event.key === 'ArrowUp' && this.showSuggestions) {
      event.preventDefault();
      this.activeSuggestionIndex = Math.max(this.activeSuggestionIndex - 1, 0);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.showSuggestions && this.activeSuggestionIndex >= 0) {
        void this.selectSuggestion(this.searchSuggestions[this.activeSuggestionIndex]);
      } else {
        void this.searchPokemon();
      }
      return;
    }
    if (event.key === 'Escape') {
      this.showSuggestions = false;
      this.activeSuggestionIndex = -1;
    }
  }

  closeSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.activeSuggestionIndex = -1;
    }, 200);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchedPokemon = null;
    this.searchSuggestions = [];
    this.showSuggestions = false;
    this.activeSuggestionIndex = -1;
    this.error = null;
  }

  canSaveTeam(): boolean {
    if (!this.teamPokemon?.length) {
      return false;
    }
    return this.teamPokemon.some(
      (p) => p.pokemon_id && p.pokemon && p.pokemon.name && p.pokemon.sprites?.front_default
    );
  }

  saveCurrentTeam(): void {
    if (!this.canSaveTeam() || this.teamPokemon.length === 0) {
      this.modalService.showError('No hay Pokémon en el equipo para guardar', 'Error');
      return;
    }

    const teamName = this.teamsService.generateTeamName();
    const pokemonNames = this.teamPokemon
      .map((p) => p.pokemon?.name || p.pokemon_name || 'Pokémon')
      .filter((name) => name !== 'Pokémon')
      .join(', ');

    this.modalService.showConfirm(
      `¿Guardar equipo "${teamName}"?\n\nPokémon en el equipo (${this.teamPokemon.length}):\n${pokemonNames}`,
      'Confirmar Guardado',
      () => {
        this.loading = true;
        this.loadingService.show('Guardando equipo...', 'Creando tu equipo Pokémon', false);

        this.trainingService
          .loadTrainingSessions()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              const trainingSessions = this.trainingService.currentSessions;
              const enrichedTeam: TeamPokemonItem[] = this.teamPokemon.map((teamPoke) => {
                const trainingSession = trainingSessions.find((s) => s.pokemonId === teamPoke.pokemon_id);
                return {
                  ...teamPoke,
                  evs: trainingSession?.currentEVs || null
                };
              });
              this.persistSavedTeam(enrichedTeam);
            },
            error: () => {
              this.persistSavedTeam(this.teamPokemon);
            }
          });
      }
    );
  }

  private persistSavedTeam(team: TeamPokemonItem[]): void {
    this.teamsService
      .createTeamFromCurrentTeam(team)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newTeam) => {
          this.clearCurrentTeam();
          this.loading = false;
          this.loadingService.hide();
          this.modalService.showSuccess(
            `El equipo Pokémon fue guardado con éxito\n\nSe guardaron ${newTeam.team_members.length} Pokémon.\n\nEl equipo actual ha sido limpiado para crear uno nuevo.`,
            '¡Equipo Guardado!'
          );
        },
        error: () => {
          this.loading = false;
          this.loadingService.hide();
          this.modalService.showError('Error al guardar el equipo. Intenta de nuevo.', 'Error');
        }
      });
  }

  goToTeams(): void {
    this.router.navigate(['/equipos']);
  }

  validateLevel(): void {
    if (this.pokemonLevel < 1) {
      this.pokemonLevel = 1;
      this.modalService.showWarning('El nivel mínimo es 1', 'Nivel Inválido');
    } else if (this.pokemonLevel > 100) {
      this.pokemonLevel = 100;
      this.modalService.showWarning(
        'El nivel máximo es 100. Los niveles comprenden desde 1 hasta 100',
        'Nivel Inválido'
      );
    }
  }

  private clearCurrentTeam(): void {
    this.teamService
      .clearTeam()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => {} });
    this.trainingService
      .clearAllSessions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => {} });
  }
}
