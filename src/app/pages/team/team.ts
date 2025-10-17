import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { firstValueFrom, catchError, of } from 'rxjs';
import { PokemonService, Pokemon, PokemonSuggestion } from '../../services/pokemon.service';
import { LoadingService, LoadingState } from '../../services/loading.service';
import { ModalService } from '../../services/modal.service';
import { LoadingComponent } from '../../components/loading/loading';
import { TeamService } from '../../services/team.service';
import { TrainingService } from '../../services/training.service';
import { FavoritesService } from '../../services/favorites.service';
import { PokemonTeamsService } from '../../services/pokemon-team-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe, LoadingComponent],
  templateUrl: './team.html',
  styleUrl: './team.scss'
})
export class Team implements OnInit, OnDestroy {
  searchTerm: string = '';
  searchedPokemon: Pokemon | null = null;
  teamPokemon: any[] = [];
  loading: boolean = false;
  error: string | null = null;
  maxTeamSize: number = 6;
  loadingState$!: Observable<LoadingState>;
  private subscriptions = new Subscription();
  private pokemonCache: Map<number, Pokemon> = new Map();

  searchSuggestions: PokemonSuggestion[] = [];
  showSuggestions = false;
  pokemonLevel: number = 50;

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

    this.subscriptions.add(
      this.teamService.team$.subscribe(team => {
        this.teamPokemon = team;
        this.enrichTeamWithPokemonData();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async enrichTeamWithPokemonData(): Promise<void> {
    for (const teamPoke of this.teamPokemon) {
      if (!teamPoke.pokemon) {
        let pokemon = this.pokemonCache.get(teamPoke.pokemon_id);

        if (!pokemon) {
          try {
            const result = await firstValueFrom(
              this.pokemonService.getPokemonById(teamPoke.pokemon_id).pipe(
                catchError(() => of(undefined))
              )
            );

            if (result) {
              pokemon = result;
              this.pokemonCache.set(teamPoke.pokemon_id, pokemon);
            }
          } catch (error) {
            // Error silencioso para producción
          }
        }

        if (pokemon) {
          teamPoke.pokemon = pokemon;
          teamPoke.selectedAbility = teamPoke.selected_ability;
        }
      }
    }
  }

  private loadTeamFromBackend(): void {
    this.teamService.loadTeam().subscribe({
      error: (error) => {
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
    this.loadingService.showSearch();

    try {
      const result = await firstValueFrom(
        this.pokemonService.getPokemonByName(this.searchTerm.toLowerCase()).pipe(
          catchError(() => of(undefined))
        )
      );

      if (result) {
        this.searchedPokemon = result;
        this.error = null;
      } else {
        this.searchedPokemon = null;
        this.error = `No se encontró el Pokemon "${this.searchTerm}"`;
      }
    } catch (error) {
      this.searchedPokemon = null;
      this.error = 'Error al buscar el Pokemon';
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  addToTeam(): void {
    if (!this.searchedPokemon) return;

    // Validar nivel
    if (this.pokemonLevel < 1 || this.pokemonLevel > 100) {
      this.modalService.showWarning('El nivel debe estar entre 1 y 100', 'Nivel Inválido');
      return;
    }

    if (this.teamPokemon.length >= this.maxTeamSize) {
      this.modalService.showWarning('Tu equipo ya está completo (máximo 6 Pokemon)', 'Equipo Completo');
      return;
    }

    const isAlreadyInTeam = this.teamPokemon.some(
      teamPoke => teamPoke.pokemon_id === this.searchedPokemon!.id
    );

    if (isAlreadyInTeam) {
      this.modalService.showWarning(`${this.searchedPokemon.name} ya está en tu equipo`, 'Pokémon Duplicado');
      return;
    }

    const selectedAbility = this.searchedPokemon.abilities[0]?.ability.name || '';
    const pokemon = this.searchedPokemon;
    const currentLevel = this.pokemonLevel;  // Guardar el nivel actual

    this.teamService.addToTeam(pokemon, selectedAbility, currentLevel).subscribe({
      next: (response) => {
        // Trackear el Pokémon agregado al equipo
        this.favoritesService.trackPokemonSearch({
          pokemon_id: pokemon.id,
          pokemon_name: pokemon.name,
          pokemon_sprite: pokemon.sprites?.front_default,
          pokemon_types: pokemon.types?.map(t => t.type.name)
        }).subscribe({
          error: () => {}
        });

        this.error = null;
        this.searchedPokemon = null;
        this.searchTerm = '';
        this.modalService.showSuccess(`${pokemon.name} (Nivel ${currentLevel}) fue agregado al equipo`, '¡Pokémon Agregado!');
        this.pokemonLevel = 50;  // Resetear nivel a 50 DESPUÉS de mostrar el mensaje
      },
      error: (error) => {
        const errorMsg = error.error?.detail || 'Error al agregar el pokémon al equipo';
        this.error = errorMsg;
        this.modalService.showError(errorMsg, 'Error');
      }
    });
  }

  removeFromTeam(teamPokemonId: number): void {
    // Obtener el Pokémon que se va a eliminar para poder eliminar su sesión de entrenamiento
    const pokemonToRemove = this.teamPokemon.find(p => p.id === teamPokemonId);
    
    this.teamService.removeFromTeam(teamPokemonId).subscribe({
      next: () => {
        this.error = null;

        // Si hay un Pokémon eliminado, eliminar también su sesión de entrenamiento
        if (pokemonToRemove) {
          this.trainingService.resetTrainingForPokemon(pokemonToRemove.pokemon_id).subscribe({
            error: () => {
              // Error silencioso si no se puede eliminar la sesión de entrenamiento
            }
          });
        }

        // Recargar favoritos después de eliminar
        this.favoritesService.loadSmartFavorites(5).subscribe();
      },
      error: (error) => {
        this.error = error.error?.detail || 'Error al eliminar el pokémon del equipo';
      }
    });
  }

  onAbilityChange(teamPokemonId: number, abilityName: string): void {
    this.teamService.updateAbility(teamPokemonId, abilityName).subscribe({
      next: () => {
        this.error = null;
      },
      error: (error) => {
        this.error = error.message || 'Error al actualizar la habilidad';
      }
    });
  }

  onSearchInput(): void {
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
    await this.searchPokemon();
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.searchPokemon();
    } else if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }

  closeSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchedPokemon = null;
    this.searchSuggestions = [];
    this.showSuggestions = false;
    this.error = null;
  }

  // Verificar si se puede guardar el equipo actual
  canSaveTeam(): boolean {
    if (!this.teamPokemon || this.teamPokemon.length === 0) {
      return false;
    }

    // Verificar que al menos un Pokémon tenga datos válidos
    return this.teamPokemon.some(p => 
      p.pokemon_id && 
      p.pokemon && 
      p.pokemon.name && 
      p.pokemon.sprites?.front_default
    );
  }

  // Guardar el equipo actual
  saveCurrentTeam(): void {
    if (!this.canSaveTeam()) {
      this.modalService.showError('No hay Pokémon en el equipo para guardar', 'Error');
      return;
    }

    if (this.teamPokemon.length === 0) {
      this.modalService.showError('No hay Pokémon en el equipo', 'Error');
      return;
    }

    // Generar nombre automático para el equipo
    const teamName = this.teamsService.generateTeamName();
    
    // Mostrar confirmación con modal
    const pokemonNames = this.teamPokemon
      .map(p => p.pokemon?.name || 'Pokémon')
      .filter(name => name !== 'Pokémon')
      .join(', ');
    
    this.modalService.showConfirm(
      `¿Guardar equipo "${teamName}"?\n\nPokémon en el equipo (${this.teamPokemon.length}):\n${pokemonNames}`,
      'Confirmar Guardado',
      () => {
        // Callback cuando se confirma
        this.loading = true;
        this.loadingService.show('Guardando equipo...', 'Creando tu equipo Pokémon', false);

        // Cargar sesiones de training para obtener los EVs
        this.trainingService.loadTrainingSessions().subscribe({
          next: () => {
            const trainingSessions = this.trainingService.currentSessions;
            
            // Enriquecer teamPokemon con EVs de training si existen
            const enrichedTeam = this.teamPokemon.map(teamPoke => {
              const trainingSession = trainingSessions.find(s => s.pokemonId === teamPoke.pokemon_id);
              return {
                ...teamPoke,
                evs: trainingSession?.currentEVs || null
              };
            });

            this.subscriptions.add(
              this.teamsService.createTeamFromCurrentTeam(enrichedTeam).subscribe({
                next: (newTeam) => {
                  // Limpiar equipo actual y sesiones de training después de guardar exitosamente
                  this.clearCurrentTeam();
                  
                  this.loading = false;
                  this.loadingService.hide();
                  this.modalService.showSuccess(
                    `El equipo Pokémon fue guardado con éxito\n\nSe guardaron ${newTeam.team_members.length} Pokémon.\n\nEl equipo actual ha sido limpiado para crear uno nuevo.`,
                    '¡Equipo Guardado!'
                  );
                },
                error: (error) => {
                  this.loading = false;
                  this.loadingService.hide();
                  console.error('Error al guardar equipo:', error);
                  this.modalService.showError('Error al guardar el equipo. Intenta de nuevo.', 'Error');
                }
              })
            );
          },
          error: () => {
            // Si falla al cargar training, guardar sin EVs
            this.subscriptions.add(
              this.teamsService.createTeamFromCurrentTeam(this.teamPokemon).subscribe({
                next: (newTeam) => {
                  // Limpiar equipo actual y sesiones de training después de guardar exitosamente
                  this.clearCurrentTeam();
                  
                  this.loading = false;
                  this.loadingService.hide();
                  this.modalService.showSuccess(
                    `El equipo Pokémon fue guardado con éxito\n\nSe guardaron ${newTeam.team_members.length} Pokémon.\n\nEl equipo actual ha sido limpiado para crear uno nuevo.`,
                    '¡Equipo Guardado!'
                  );
                },
                error: (error) => {
                  this.loading = false;
                  this.loadingService.hide();
                  console.error('Error al guardar equipo:', error);
                  this.modalService.showError('Error al guardar el equipo. Intenta de nuevo.', 'Error');
                }
              })
            );
          }
        });
      }
    );
  }

  // Ir a la página de equipos
  goToTeams(): void {
    this.router.navigate(['/equipos']);
  }

  // Validar nivel del Pokémon
  validateLevel(): void {
    if (this.pokemonLevel < 1) {
      this.pokemonLevel = 1;
      this.modalService.showWarning('El nivel mínimo es 1', 'Nivel Inválido');
    } else if (this.pokemonLevel > 100) {
      this.pokemonLevel = 100;
      this.modalService.showWarning('El nivel máximo es 100. Los niveles comprenden desde 1 hasta 100', 'Nivel Inválido');
    }
  }


  // Limpiar equipo actual y sesiones de training
  private clearCurrentTeam(): void {
    // Limpiar equipo
    this.teamService.clearTeam().subscribe({
      next: () => {
        console.log('Equipo actual limpiado');
      },
      error: (error) => {
        console.error('Error al limpiar equipo:', error);
      }
    });

    // Limpiar sesiones de training
    this.trainingService.clearAllSessions().subscribe({
      next: () => {
        console.log('Sesiones de training limpiadas');
      },
      error: (error) => {
        console.error('Error al limpiar sesiones de training:', error);
      }
    });
  }
}
