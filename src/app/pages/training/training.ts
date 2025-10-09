import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { TrainingService } from '../../services/training.service';
import { LoadingService, LoadingState } from '../../services/loading.service';
import { LoadingComponent } from '../../components/loading/loading';
import { TrainingSession, TrainingValidation, TrainingForm } from '../../shared/interfaces';
import { TeamService } from '../../services/team.service';

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

  constructor(
    private trainingService: TrainingService,
    private loadingService: LoadingService,
    private teamService: TeamService,
    private fb: FormBuilder
  ) {
    this.trainingForm = this.fb.group({
      hp: [0, [Validators.min(0), Validators.max(252)]],
      attack: [0, [Validators.min(0), Validators.max(252)]],
      defense: [0, [Validators.min(0), Validators.max(252)]],
      specialAttack: [0, [Validators.min(0), Validators.max(252)]],
      specialDefense: [0, [Validators.min(0), Validators.max(252)]],
      speed: [0, [Validators.min(0), Validators.max(252)]]
    });
  }

  ngOnInit(): void {
    this.loadingState$ = this.loadingService.loading$;

    // Limpiar cache antes de cargar datos frescos
    this.teamService.clearCache();
    this.trainingService.clearCache();

    this.loadTeamAndSessions();
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadTeamAndSessions(): void {
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
        hp: 0,
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0
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
      alert('Error: No hay una sesión de Pokemon activa');
      return;
    }

    if (!this.validation || !this.validation.isValid) {
      alert('Error de validación: ' + (this.validation?.errors?.join(', ') || 'Formulario inválido'));
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

        alert('¡Entrenamiento aplicado exitosamente!');
      },
      error: () => {
        alert('Error al aplicar el entrenamiento');
      }
    });
  }

  resetTraining(): void {
    if (this.currentSession && this.currentSession.id) {
      this.trainingService.resetTraining(this.currentSession.id).subscribe({
        next: () => {
          this.initializeTrainingSessions();
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
