import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, AsyncPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Pokemon } from '../../services/pokemon.service';
import { TrainingService } from '../../services/training.service';
import { LoadingService, LoadingState } from '../../services/loading.service';
import { LoadingComponent } from '../../components/loading/loading';
import { TrainingSession, TrainingValidation, TrainingForm } from '../../shared/interfaces';

interface TeamPokemon {
  pokemon: Pokemon;
  selectedAbility: string;
}

@Component({
  selector: 'app-training',
  imports: [CommonModule, AsyncPipe, FormsModule, ReactiveFormsModule, LoadingComponent, RouterLink],
  templateUrl: './training.html',
  styleUrl: './training.scss'
})
export class Training implements OnInit, OnDestroy {
  teamPokemon: TeamPokemon[] = [];
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
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
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
    this.loadTeamFromStorage();
    this.initializeTrainingSessions();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Cargar equipo desde localStorage
  private loadTeamFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const savedTeam = localStorage.getItem('pokemonTeam');
        if (savedTeam) {
          this.teamPokemon = JSON.parse(savedTeam);
        }
      } catch (error) {
        console.error('Error loading team from storage:', error);
        this.teamPokemon = [];
      }
    }
  }

  // Inicializar sesiones de entrenamiento
  private initializeTrainingSessions(): void {
    if (this.teamPokemon.length > 0) {
      this.trainingSessions = this.trainingService.getTeamTrainingSessions(
        this.teamPokemon.map(tp => tp.pokemon)
      );
      this.setCurrentSession(0);
    }
  }

  // Configurar validación del formulario
  private setupFormValidation(): void {
    this.subscriptions.add(
      this.trainingForm.valueChanges.subscribe(() => {
        this.validateForm();
      })
    );
  }

  // Validar formulario
  private validateForm(): void {
    if (this.currentSession) {
      const formValue = this.trainingForm.value;
      this.validation = this.trainingService.validateTrainingForm(formValue, this.currentSession.currentEVs);
    }
  }

  // Establecer sesión actual
  private setCurrentSession(index: number): void {
    if (index >= 0 && index < this.trainingSessions.length) {
      this.currentPokemonIndex = index;
      this.currentSession = this.trainingSessions[index];
      this.updateFormWithCurrentEVs();
    }
  }

  // Actualizar formulario con EVs actuales
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
    }
  }

  // Navegar al Pokemon anterior
  previousPokemon(): void {
    if (this.currentPokemonIndex > 0) {
      this.setCurrentSession(this.currentPokemonIndex - 1);
    }
  }

  // Navegar al Pokemon siguiente
  nextPokemon(): void {
    if (this.currentPokemonIndex < this.trainingSessions.length - 1) {
      this.setCurrentSession(this.currentPokemonIndex + 1);
    }
  }

  // Ir a un Pokemon específico
  goToPokemon(index: number): void {
    this.setCurrentSession(index);
  }

  // Aplicar entrenamiento
  applyTraining(): void {
    if (this.currentSession && this.validation?.isValid) {
      const formValue = this.trainingForm.value;
      const success = this.trainingService.applyTraining(this.currentSession.pokemonId, formValue);

      if (success) {
        this.loadingService.show('¡Entrenamiento aplicado!', 'Tu Pokemon ha mejorado sus estadísticas', false);
        setTimeout(() => {
          this.loadingService.hide();
          this.initializeTrainingSessions(); // Recargar sesiones
        }, 2000);
      }
    }
  }

  // Resetear entrenamiento
  resetTraining(): void {
    if (this.currentSession) {
      this.trainingService.resetTraining(this.currentSession.pokemonId);
      this.initializeTrainingSessions();
    }
  }

  // Obtener nombre de estadística
  getStatName(stat: string): string {
    return this.trainingService.getStatDisplayName(stat);
  }

  // Verificar si el Pokemon está entrenado
  isPokemonTrained(index: number): boolean {
    return this.trainingSessions[index]?.isCompleted || false;
  }

  // Obtener progreso de EVs
  getEVProgress(current: number, max: number): number {
    return Math.min((current / max) * 100, 100);
  }

  // Obtener clase de progreso
  getProgressClass(progress: number): string {
    if (progress >= 80) return 'progress-high';
    if (progress >= 50) return 'progress-medium';
    return 'progress-low';
  }
}
