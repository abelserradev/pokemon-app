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
    this.loadTeamAndSessions();
    this.setupFormValidation();

    // Suscribirse a cambios en el equipo
    this.subscriptions.add(
      this.teamService.team$.subscribe(team => {
        console.log('Equipo actualizado en Training:', team);
        if (team.length > 0) {
          this.teamPokemon = team;
          // Siempre recargar sesiones cuando cambie el equipo
          this.initializeTrainingSessions();
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
        }
      },
      error: (error) => {
        console.error('Error al cargar el equipo:', error);
      }
    });
  }

  private initializeTrainingSessions(): void {
    this.subscriptions.add(
      this.trainingService.loadTrainingSessions().subscribe({
        next: () => {
          // Obtener las sesiones transformadas desde el servicio
          const transformedSessions = this.trainingService.currentSessions;
          console.log('Sesiones desde currentSessions:', transformedSessions);

          this.trainingSessions = transformedSessions;

          if (transformedSessions.length > 0) {
            this.currentSession = transformedSessions[0];
            console.log('currentSession asignada:', this.currentSession);
            console.log('pokemonSprite:', this.currentSession?.pokemonSprite);
            console.log('pokemonTypes:', this.currentSession?.pokemonTypes);
            console.log('baseStats:', this.currentSession?.baseStats);
            console.log('currentEVs:', this.currentSession?.currentEVs);
          } else {
            console.log('No hay sesiones de entrenamiento');
          }
        },
        error: (error) => {
          console.error('Error al cargar sesiones de entrenamiento:', error);
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
      console.error('No hay sesión de entrenamiento válida');
      return;
    }

    this.trainingService.applyTraining(
      this.currentSession.id,
      this.trainingForm.value as TrainingForm,
      this.currentSession.currentEVs
    ).subscribe({
      next: (response: any) => {
        console.log('Respuesta de applyTraining:', response);

        // Obtener la sesión actualizada desde el servicio
        const updatedSession = this.trainingService.currentSessions.find(s => s.id === this.currentSession!.id);

        if (updatedSession) {
          console.log('Sesión actualizada obtenida del servicio:', updatedSession);
          this.currentSession = updatedSession;

          // Actualizar también en la lista
          const index = this.trainingSessions.findIndex(s => s.id === updatedSession.id);
          if (index !== -1) {
            this.trainingSessions[index] = updatedSession;
          }
        }

        this.trainingForm.reset();
        this.validation = null;

        alert('¡Entrenamiento aplicado exitosamente!');
      },
      error: (error: any) => {
        console.error('Error al aplicar entrenamiento:', error);
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
        error: (error) => {
          console.error('Error al resetear entrenamiento:', error);
        }
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
