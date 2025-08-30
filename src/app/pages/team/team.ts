import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { firstValueFrom, catchError, of } from 'rxjs';
import { PokemonService, Pokemon } from '../../services/pokemon.service';
import { LoadingService, LoadingState } from '../../services/loading.service';
import { LoadingComponent } from '../../components/loading/loading';



interface TeamPokemon {
  pokemon: Pokemon;
  selectedAbility: string;
}


@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule,  FormsModule, AsyncPipe, LoadingComponent],
  templateUrl: './team.html',
  styleUrl: './team.scss'
})
export class Team implements OnInit {
  searchTerm: string = '';
  searchedPokemon: Pokemon | null = null;
  teamPokemon: TeamPokemon[] = [];
  loading: boolean = false;
  error: string | null = null;
  maxTeamSize: number = 6;
  loadingState$!: Observable<LoadingState>;

  constructor(
    private pokemonService: PokemonService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingState$ = this.loadingService.loading$;
    this.loadTeamFromStorage();
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
      const pokemon = await firstValueFrom(
        this.pokemonService.getPokemonByName(this.searchTerm.toLowerCase()).pipe(
          catchError(() => of(null))
        )
      );

      if (pokemon) {
        this.searchedPokemon = pokemon;
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

    // Verificar si el equipo ya está lleno
    if (this.teamPokemon.length >= this.maxTeamSize) {
      this.error = 'Tu equipo ya está completo (máximo 6 Pokemon)';
      return;
    }

    // Verificar si el Pokemon ya está en el equipo
    const isAlreadyInTeam = this.teamPokemon.some(teamPoke => teamPoke.pokemon.id === this.searchedPokemon!.id);
    if (isAlreadyInTeam) {
      this.error = `${this.searchedPokemon.name} ya está en tu equipo`;
      return;
    }

    // Agregar Pokemon al equipo con la primera habilidad seleccionada por defecto
    const teamPokemon: TeamPokemon = {
      pokemon: this.searchedPokemon,
      selectedAbility: this.searchedPokemon.abilities[0]?.ability.name || ''
    };

    this.teamPokemon.push(teamPokemon);
    this.saveTeamToStorage();
    this.error = null;

    // Limpiar búsqueda
    this.searchedPokemon = null;
    this.searchTerm = '';
  }

  removeFromTeam(pokemonId: number): void {
    this.teamPokemon = this.teamPokemon.filter(teamPoke => teamPoke.pokemon.id !== pokemonId);
    this.saveTeamToStorage();
    this.error = null;
  }

  onAbilityChange(pokemonId: number, abilityName: string): void {
    const teamPoke = this.teamPokemon.find(tp => tp.pokemon.id === pokemonId);
    if (teamPoke) {
      teamPoke.selectedAbility = abilityName;
      this.saveTeamToStorage();
    }
  }

  private saveTeamToStorage(): void {
    localStorage.setItem('pokemonTeam', JSON.stringify(this.teamPokemon));
  }

  private loadTeamFromStorage(): void {
    const savedTeam = localStorage.getItem('pokemonTeam');
    if (savedTeam) {
      try {
        this.teamPokemon = JSON.parse(savedTeam);
      } catch (error) {
        console.error('Error loading team from storage:', error);
        this.teamPokemon = [];
      }
    }
  }
}
