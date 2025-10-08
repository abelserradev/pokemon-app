import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { firstValueFrom, catchError, of } from 'rxjs';
import { PokemonService, Pokemon } from '../../services/pokemon.service';
import { LoadingService, LoadingState } from '../../services/loading.service';
import { LoadingComponent } from '../../components/loading/loading';
import { TeamService } from '../../services/team.service';
import { TrainingService } from '../../services/training.service';
import { FavoritesService } from '../../services/favorites.service';
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

  constructor(
    private pokemonService: PokemonService,
    private loadingService: LoadingService,
    private teamService: TeamService,
    private trainingService: TrainingService,
    private favoritesService: FavoritesService,
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
            console.error('Error loading pokemon data:', error);
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
      next: (team) => {
        console.log('Equipo cargado desde el backend:', team);
      },
      error: (error) => {
        console.error('Error al cargar el equipo:', error);
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
      console.error('Error searching Pokemon:', error);
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  addToTeam(): void {
    if (!this.searchedPokemon) return;

    if (this.teamPokemon.length >= this.maxTeamSize) {
      this.error = 'Tu equipo ya está completo (máximo 6 Pokemon)';
      return;
    }

    const isAlreadyInTeam = this.teamPokemon.some(
      teamPoke => teamPoke.pokemon_id === this.searchedPokemon!.id
    );

    if (isAlreadyInTeam) {
      this.error = `${this.searchedPokemon.name} ya está en tu equipo`;
      return;
    }

    const selectedAbility = this.searchedPokemon.abilities[0]?.ability.name || '';
    const pokemon = this.searchedPokemon;

    this.teamService.addToTeam(pokemon, selectedAbility).subscribe({
      next: (newPokemon) => {
        console.log('Pokémon agregado al equipo:', newPokemon);

        // Recargar favoritos
        this.favoritesService.loadFavorites(5).subscribe();

        this.error = null;
        this.searchedPokemon = null;
        this.searchTerm = '';
      },
      error: (error) => {
        console.error('Error al agregar pokémon:', error);
        this.error = error.error?.detail || 'Error al agregar el pokémon al equipo';
      }
    });
  }

  removeFromTeam(teamPokemonId: number): void {
    console.log('Intentando eliminar pokémon con BD ID:', teamPokemonId);
    console.log('Equipo actual:', this.teamPokemon);

    this.teamService.removeFromTeam(teamPokemonId).subscribe({
      next: () => {
        console.log('Pokémon eliminado del equipo exitosamente');
        this.error = null;

        // Recargar favoritos después de eliminar
        this.favoritesService.loadFavorites(5).subscribe();
      },
      error: (error) => {
        console.error('Error al eliminar pokémon:', error);
        this.error = error.error?.detail || 'Error al eliminar el pokémon del equipo';
      }
    });
  }

  onAbilityChange(teamPokemonId: number, abilityName: string): void {
    console.log(`Cambiando habilidad para teamPokemonId: ${teamPokemonId} a: ${abilityName}`);

    this.teamService.updateAbility(teamPokemonId, abilityName).subscribe({
      next: (updatedPokemon) => {
        console.log('Habilidad actualizada exitosamente:', updatedPokemon);
        this.error = null; // Limpiar errores previos
      },
      error: (error) => {
        console.error('Error al actualizar habilidad:', error);
        this.error = error.message || 'Error al actualizar la habilidad';
      }
    });
  }
}
