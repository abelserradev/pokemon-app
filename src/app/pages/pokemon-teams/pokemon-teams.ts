import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { PokemonTeamsService } from '../../services/pokemon-team-service';
import { LoadingService, LoadingState } from '../../services/loading.service';
import { ModalService } from '../../services/modal.service';
import { LoadingComponent } from '../../components/loading/loading';
import { TeamDetailModalComponent } from '../../components/team-detail-modal/team-detail-modal';
import { PokemonTeam } from '../../shared/interfaces';

@Component({
  selector: 'app-pokemon-teams',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FormsModule, ReactiveFormsModule, LoadingComponent, TeamDetailModalComponent],
  templateUrl: './pokemon-teams.html',
  styleUrl: './pokemon-teams.scss'
})
export class PokemonTeams implements OnInit, OnDestroy {
  teams: PokemonTeam[] = [];
  loading = false;
  loadingState$!: Observable<LoadingState>;
  private subscriptions = new Subscription();

  
  // Modal de detalles
  showDetailModal = false;
  selectedTeam: PokemonTeam | null = null;

  constructor(
    private teamsService: PokemonTeamsService,
    private loadingService: LoadingService,
    private modalService: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadingState$ = this.loadingService.loading$;
    
    // Defer loadData to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadData();
    }, 0);
    
    // Suscribirse a cambios en los equipos
    this.subscriptions.add(
      this.teamsService.teams$.subscribe(teams => {
        this.teams = teams;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadData(): void {
    this.loading = true;
    this.loadingService.show('Cargando equipos...', 'Preparando tus equipos Pokémon', false);

    // Cargar equipos existentes
    this.subscriptions.add(
      this.teamsService.loadTeams().subscribe({
        next: (teams) => {
          this.teams = teams;
          this.loading = false;
          this.loadingService.hide();
        },
        error: () => {
          this.loading = false;
          this.loadingService.hide();
        }
      })
    );

  }


  // Eliminar equipo
  deleteTeam(team: PokemonTeam): void {
    if (!team.id) return;

    const teamId = team.id;
    const teamName = team.team_name;

    this.modalService.showConfirm(
      `¿Estás seguro de que quieres eliminar el equipo "${teamName}"?`,
      'Confirmar Eliminación',
      () => {
        // Verificar que el equipo aún existe antes de eliminar
        const teamStillExists = this.teams.some(t => t.id === teamId);
        if (!teamStillExists) {
          this.modalService.showWarning('El equipo ya fue eliminado', 'Equipo No Encontrado');
          return;
        }

        this.teamsService.deleteTeam(teamId).subscribe({
          next: () => {
            this.modalService.showSuccess(`El equipo "${teamName}" fue eliminado`, 'Equipo Eliminado');
          },
          error: (err) => {
            if (err.status === 404) {
              this.modalService.showWarning('El equipo ya fue eliminado', 'Equipo No Encontrado');
            } else if (err.status === 401) {
              this.modalService.showSuccess(`El equipo "${teamName}" fue eliminado`, 'Equipo Eliminado');
            } else {
              this.modalService.showError('Error al eliminar el equipo', 'Error');
            }
          }
        });
      }
    );
  }

  // Toggle estado activo del equipo
  toggleTeamStatus(team: PokemonTeam): void {
    if (!team.id) return;

    const teamId = team.id;

    this.teamsService.toggleTeamFavorite(teamId).subscribe({
      next: (updatedTeam) => {
        const message = updatedTeam.is_favorite 
          ? `El equipo "${updatedTeam.team_name}" fue marcado como favorito`
          : `El equipo "${updatedTeam.team_name}" ya no es favorito`;
        const title = updatedTeam.is_favorite ? '⭐ Favorito' : 'Favorito Removido';
        this.modalService.showSuccess(message, title);
      },
      error: () => {
        this.modalService.showError('Error al cambiar el estado del equipo', 'Error');
      }
    });
  }


  // Obtener estadísticas totales del equipo
  getTeamTotalStats(team: PokemonTeam): any {
    return team.team_members.reduce((totals, pokemon) => {
      const evs = pokemon.evs || {};
      totals.hp += evs['hp'] || 0;
      totals.attack += evs['attack'] || 0;
      totals.defense += evs['defense'] || 0;
      totals.specialAttack += evs['special-attack'] || 0;
      totals.specialDefense += evs['special-defense'] || 0;
      totals.speed += evs['speed'] || 0;
      return totals;
    }, { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 });
  }


  // Obtener clase CSS para el estado del equipo
  getTeamStatusClass(team: PokemonTeam): string {
    return team.is_favorite ? 'team-favorite' : 'team-normal';
  }

  // Obtener texto del estado del equipo
  getTeamStatusText(team: PokemonTeam): string {
    return team.is_favorite ? '⭐ Favorito' : 'Marcar favorito';
  }


  // Abrir modal de detalles del equipo
  openTeamDetail(team: PokemonTeam): void {
    this.selectedTeam = team;
    this.showDetailModal = true;
  }

  // Cerrar modal de detalles
  closeTeamDetail(): void {
    this.showDetailModal = false;
    this.selectedTeam = null;
  }

  // Ir a entrenar el equipo
  trainTeam(team: PokemonTeam): void {
    if (!team.id) {
      this.modalService.showError('Equipo inválido', 'Error');
      return;
    }

    this.loading = true;
    this.loadingService.show('Cargando equipo...', 'Preparando sesiones de entrenamiento', false);

    // Cerrar el modal primero
    this.closeTeamDetail();

    this.teamsService.loadTeamForTraining(team.id).subscribe({
      next: (response) => {
        console.log('Equipo cargado para training:', response);
        
        this.loading = false;
        this.loadingService.hide();
        
        // Pequeño delay para asegurar que el backend complete la carga
        setTimeout(() => {
          this.router.navigate(['/entrenamiento']).then(() => {
            this.modalService.showSuccess(
              `Equipo "${team.team_name}" cargado. ${response.sessions_created?.length || 0} Pokémon listos para entrenar.`,
              '¡Equipo Cargado!'
            );
          });
        }, 500); // 500ms delay
      },
      error: (error) => {
        this.loading = false;
        this.loadingService.hide();
        console.error('Error al cargar equipo:', error);
        
        let errorMessage = 'Error al cargar el equipo para entrenamiento.';
        if (error.status === 404) {
          errorMessage = 'Equipo no encontrado';
        } else if (error.status === 500) {
          errorMessage = 'Error del servidor. Verifica que el backend esté implementado correctamente.';
        }
        
        this.modalService.showError(errorMessage, 'Error');
      }
    });
  }
}
