import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TrainingService } from '../../services/training.service';
import { LoadingService, LoadingState } from '../../services/loading.service';
import { ModalService } from '../../services/modal.service';
import { LoadingComponent } from '../../components/loading/loading';
import { TrainingSession, TrainingValidation, TrainingForm } from '../../shared/interfaces';
import { TeamService } from '../../services/team.service';
import { PokemonTeamsService } from '../../services/pokemon-team-service';


@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FormsModule, ReactiveFormsModule, LoadingComponent, RouterLink],
  templateUrl: './training.html',
  styleUrl: './training.scss'
})
export class Training implements OnInit, OnDestroy {
  teamPokemon: any[] = [];
  trainingSessions: TrainingSession[] = [];
  currentPokemonIndex = 0;
  currentSession: TrainingSession | null = null;
  trainingForm: FormGroup;
  validation: TrainingValidation | null = null;
  loadingState$!: Observable<LoadingState>;
  private subscriptions = new Subscription();
  isTrainingSavedTeam = false;
  savedTeamName = '';

  constructor(
    private trainingService: TrainingService,
    private loadingService: LoadingService,
    private modalService: ModalService,
    private teamService: TeamService,
    private teamsService: PokemonTeamsService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.trainingForm = this.fb.group({
      hp: [null, [Validators.min(0), Validators.max(252)]],
      attack: [null, [Validators.min(0), Validators.max(252)]], 
      defense: [null, [Validators.min(0), Validators.max(252)]], 
      specialAttack: [null, [Validators.min(0), Validators.max(252)]], 
      specialDefense: [null, [Validators.min(0), Validators.max(252)]], 
      speed: [null, [Validators.min(0), Validators.max(252)]] 
    });
  }

  ngOnInit(): void {
    this.loadingState$ = this.loadingService.loading$;

    // Cargar datos inicialmente
    this.loadTrainingData();

    // Suscribirse a eventos de navegación para recargar cuando se navega a esta ruta
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        // Solo recargar si estamos en la ruta de entrenamiento
        if (event.url === '/entrenamiento') {
          this.loadTrainingData();
        }
      })
    );

    this.setupFormValidation();

    // Suscribirse a cambios en el equipo
    this.subscriptions.add(
      this.teamService.team$.subscribe(team => {
        if (team.length > 0) {
          this.teamPokemon = team;
          // Siempre recargar sesiones cuando cambie el equipo
          this.initializeTrainingSessions();
        } else {
          // Si no hay equipo, limpiar sesiones
          this.trainingSessions = [];
          this.currentSession = null;
          this.teamPokemon = [];
        }
      })
    );
  }

  // Método centralizado para cargar datos de entrenamiento
  private loadTrainingData(): void {
    // Verificar si hay un equipo guardado siendo entrenado
    const savedTeamId = this.teamsService.getCurrentTrainingTeamId();
    if (savedTeamId) {
      this.isTrainingSavedTeam = true;
      // Cargar equipos si aún no están cargados
      if (this.teamsService.currentTeams.length === 0) {
        this.teamsService.loadTeams().subscribe({
          next: () => {
            const team = this.teamsService.currentTeams.find(t => t.id === savedTeamId);
            this.savedTeamName = team?.team_name || 'Equipo Guardado';
            this.loadTeamAndSessions();
          }
        });
      } else {
        const team = this.teamsService.currentTeams.find(t => t.id === savedTeamId);
        this.savedTeamName = team?.team_name || 'Equipo Guardado';
        this.loadTeamAndSessions();
      }
    } else {
      this.isTrainingSavedTeam = false;
      this.savedTeamName = '';
      this.loadTeamAndSessions();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Limpiar el ID del equipo guardado al salir del componente
    // Solo si todos los Pokémon están completamente entrenados
    const allCompleted = this.trainingSessions.every(s => s.isCompleted);
    if (allCompleted) {
      this.teamsService.clearCurrentTrainingTeamId();
    }
  }

  private loadTeamAndSessions(): void {
    // Limpiar cache antes de cargar datos frescos
    this.teamService.clearCache();
    this.trainingService.clearCache();
    
    this.teamService.loadTeam().subscribe({
      next: (team) => {
        this.teamPokemon = team;
        if (team.length > 0) {
          this.initializeTrainingSessions();
        } else {
          this.trainingSessions = [];
          this.currentSession = null;
        }
      },
      error: () => {
        this.teamPokemon = [];
        this.trainingSessions = [];
        this.currentSession = null;
      }
    });
  }

  private initializeTrainingSessions(): void {
    this.subscriptions.add(
      this.trainingService.loadTrainingSessions().subscribe({
        next: () => {
          const transformedSessions = this.trainingService.currentSessions;
          const currentTeamIds = this.teamPokemon.map(p => p.pokemon_id);
          
          const validSessions = transformedSessions.filter(session =>
            currentTeamIds.includes(session.pokemonId)
          );

          this.trainingSessions = validSessions;

          if (validSessions.length > 0) {
            this.currentSession = validSessions[0];
            this.currentPokemonIndex = 0;
          } else {
            this.currentSession = null;
            this.currentPokemonIndex = 0;
          }
        },
        error: () => {
          this.trainingSessions = [];
          this.currentSession = null;
          this.currentPokemonIndex = 0;
        }
      })
    );
  }

  private setupFormValidation(): void {
    this.subscriptions.add(
      this.trainingForm.valueChanges.subscribe(() => {
        // Solo validar si hay una sesión actual con currentEVs
        if (this.currentSession?.currentEVs) {
          this.validateForm();
        }
      })
    );
  }

  private validateForm(): void {
    if (this.currentSession && this.currentSession.currentEVs) {
      const formValue = this.trainingForm.value;
      this.validation = this.trainingService.validateTrainingForm(formValue, this.currentSession.currentEVs);
    }
  }

  private setCurrentSession(index: number): void {
    if (index >= 0 && index < this.trainingSessions.length) {
      this.currentPokemonIndex = index;
      this.currentSession = this.trainingSessions[index];
      this.updateFormWithCurrentEVs();
    }
  }

  private updateFormWithCurrentEVs(): void {
    if (this.currentSession) {
      this.trainingForm.patchValue({
        hp: null, 
        defense: null, 
        specialAttack: null, 
        specialDefense: null, 
        speed: null 
      }, { emitEvent: false });

      setTimeout(() => {
        this.validateForm();
      }, 100);
    }
  }

  previousPokemon(): void {
    if (this.currentPokemonIndex > 0) {
      this.setCurrentSession(this.currentPokemonIndex - 1);
    }
  }

  nextPokemon(): void {
    if (this.currentPokemonIndex < this.trainingSessions.length - 1) {
      this.setCurrentSession(this.currentPokemonIndex + 1);
    }
  }

  goToPokemon(index: number): void {
    this.setCurrentSession(index);
  }

  applyTraining(): void {
    if (!this.currentSession) {
      this.modalService.showError('No hay una sesión de Pokemon activa', 'Error');
      return;
    }

    if (!this.validation || !this.validation.isValid) {
      this.modalService.showError(
        this.validation?.errors?.join(', ') || 'Formulario inválido',
        'Error de validación'
      );
      return;
    }

    if (!this.currentSession.id) {
      return;
    }

    this.trainingService.applyTraining(
      this.currentSession.id,
      this.trainingForm.value as TrainingForm,
      this.currentSession.currentEVs
    ).subscribe({
      next: () => {
        const updatedSession = this.trainingService.currentSessions.find(s => s.id === this.currentSession!.id);

        if (updatedSession) {
          this.currentSession = updatedSession;

          const index = this.trainingSessions.findIndex(s => s.id === updatedSession.id);
          if (index !== -1) {
            this.trainingSessions[index] = updatedSession;
          }
        }

        this.trainingForm.reset();
        this.validation = null;

        // Actualizar el equipo guardado con los nuevos EVs si existe
        this.updateSavedTeamEVs();

        this.modalService.showSuccess('Los EVs fueron aplicados con éxito', '¡Entrenamiento Completado!');
      },
      error: () => {
        this.modalService.showError('Error al aplicar el entrenamiento', 'Error');
      }
    });
  }

  // Actualizar EVs del equipo guardado después de entrenar
  private updateSavedTeamEVs(): void {
    const teamId = this.teamsService.getCurrentTrainingTeamId();
    
    if (!teamId) {
      // No hay equipo guardado siendo entrenado, es el equipo normal
      return;
    }

    // Preparar datos actualizados de los Pokémon con sus EVs
    const updatedMembers = this.trainingSessions.map(session => ({
      pokemon_id: session.pokemonId,
      evs: {
        hp: session.currentEVs.hp,
        attack: session.currentEVs.attack,
        defense: session.currentEVs.defense,
        'special-attack': session.currentEVs.specialAttack,
        'special-defense': session.currentEVs.specialDefense,
        speed: session.currentEVs.speed
      }
    }));

    // Actualizar el equipo guardado en el backend
    this.teamsService.updateTeamEVs(teamId, updatedMembers).subscribe({
      next: () => {
        // EVs actualizados exitosamente
      },
      error: () => {
        // No mostrar error al usuario, es una operación secundaria
      }
    });
  }

  resetTraining(): void {
    if (this.currentSession && this.currentSession.id) {
      this.trainingService.resetTraining(this.currentSession.id).subscribe({
        next: () => {
          this.initializeTrainingSessions();
          
          // Si se resetea un equipo guardado, actualizar también el equipo guardado
          const teamId = this.teamsService.getCurrentTrainingTeamId();
          if (teamId) {
            this.updateSavedTeamEVs();
          }
        },
        error: () => {}
      });
    }
  }

  getStatName(stat: string): string {
    return this.trainingService.getStatDisplayName(stat);
  }

  isPokemonTrained(index: number): boolean {
    return this.trainingSessions[index]?.isCompleted || false;
  }

  getEVProgress(current: number, max: number): number {
    return Math.min((current / max) * 100, 100);
  }

  getProgressClass(progress: number): string {
    if (progress >= 80) return 'progress-high';
    if (progress >= 50) return 'progress-medium';
    return 'progress-low';
  }

}
