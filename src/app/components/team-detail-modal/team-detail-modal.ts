import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonTeam, PokemonTeamMemberResponse } from '../../shared/interfaces';
import { PokemonService } from '../../services/pokemon.service';
import { PokemonTeamsService } from '../../services/pokemon-team-service';
import { ModalService } from '../../services/modal.service';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { Router } from '@angular/router';

interface PokemonMove {
  name: string;
  learnMethod: 'level-up' | 'egg' | 'machine' | 'tutor';
  level?: number;
}

@Component({
  selector: 'app-team-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-detail-modal.html',
  styleUrl: './team-detail-modal.scss'
})
export class TeamDetailModalComponent implements OnInit {
  @Input() team: PokemonTeam | null = null;
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() trainTeam = new EventEmitter<PokemonTeam>();
  @ViewChild('nicknameInput') nicknameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('levelInput') levelInput?: ElementRef<HTMLInputElement>;

  selectedPokemon: PokemonTeamMemberResponse | null = null;
  pokemonMoves: PokemonMove[] = [];
  loadingMoves = false;

  // Edición de nickname
  editingNickname = false;
  tempNickname = '';
  
  // Edición de nivel
  editingLevel = false;
  tempLevel = 50;

  constructor(
    private pokemonService: PokemonService,
    private teamsService: PokemonTeamsService,
    private modalService: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.team && this.team.team_members.length > 0) {
      this.selectPokemon(this.team.team_members[0]);
    }
  }

  close(): void {
    this.isVisible = false;
    this.selectedPokemon = null;
    this.pokemonMoves = [];
    this.closed.emit();
  }

  selectPokemon(pokemon: PokemonTeamMemberResponse): void {
    this.selectedPokemon = pokemon;
    this.loadPokemonMoves(pokemon.pokemon_id);
  }

  loadPokemonMoves(pokemonId: number): void {
    this.loadingMoves = true;
    this.pokemonMoves = [];

    this.pokemonService.getPokemonById(pokemonId).subscribe({
      next: (pokemon: any) => {
        // Extraer movimientos de la API
        if (pokemon.moves && Array.isArray(pokemon.moves)) {
          const allMoves: PokemonMove[] = [];

          pokemon.moves.forEach((moveData: any) => {
            // Iterar sobre todos los version_group_details para capturar todos los movimientos
            if (moveData.version_group_details && Array.isArray(moveData.version_group_details)) {
              moveData.version_group_details.forEach((versionDetail: any) => {
                const learnMethod = versionDetail.move_learn_method?.name || 'level-up';
                const level = versionDetail.level_learned_at || 0;
                const normalizedLevel = level > 0 ? level : undefined;
                
                // Evitar duplicados - comparar con el nivel normalizado
                const exists = allMoves.some(m => 
                  m.name === moveData.move.name && 
                  m.learnMethod === learnMethod &&
                  m.level === normalizedLevel
                );

                if (!exists) {
                  allMoves.push({
                    name: moveData.move.name,
                    learnMethod: learnMethod as 'level-up' | 'egg' | 'machine' | 'tutor',
                    level: normalizedLevel
                  });
                }
              });
            }
          });

          // Ordenar movimientos por nivel para level-up
          allMoves.sort((a, b) => {
            if (a.learnMethod === 'level-up' && b.learnMethod === 'level-up') {
              return (a.level || 0) - (b.level || 0);
            }
            return 0;
          });

          this.pokemonMoves = allMoves;
        }
        this.loadingMoves = false;
      },
      error: () => {
        this.loadingMoves = false;
        this.pokemonMoves = [];
      }
    });
  }

  getMovesByMethod(method: string): PokemonMove[] {
    return this.pokemonMoves.filter(m => m.learnMethod === method);
  }

  hasTrainedEVs(pokemon: PokemonTeamMemberResponse): boolean {
    if (!pokemon.evs) return false;
    const totalEVs = Object.values(pokemon.evs).reduce((sum, ev) => sum + ev, 0);
    return totalEVs > 0;
  }

  getTotalEVs(pokemon: PokemonTeamMemberResponse): number {
    if (!pokemon.evs) return 0;
    return Object.values(pokemon.evs).reduce((sum, ev) => sum + ev, 0);
  }

  onTrainTeam(): void {
    if (this.team) {
      this.trainTeam.emit(this.team);
      this.close();
    }
  }

  getLearnMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      'level-up': 'Por Nivel',
      'egg': 'Movimiento Huevo',
      'machine': 'MT/MO',
      'tutor': 'Tutor'
    };
    return labels[method] || method;
  }

  // Métodos para editar nickname
  startEditingNickname(): void {
    if (!this.selectedPokemon) return;
    this.editingNickname = true;
    this.tempNickname = this.selectedPokemon.nickname || '';
    setTimeout(() => this.nicknameInput?.nativeElement.focus(), 0);
  }

  cancelEditingNickname(): void {
    this.editingNickname = false;
    this.tempNickname = '';
  }

  saveNickname(): void {
    if (!this.selectedPokemon || !this.team || !this.team.id) {
      this.cancelEditingNickname();
      return;
    }

    // Validar nickname con el validador de seguridad
    const nicknameValue = this.tempNickname.trim();
    const validator = CustomValidators.safeNickname();
    const validationResult = validator({ value: nicknameValue } as any);

    if (validationResult) {
      // Mostrar errores de validación
      if (validationResult['containsHtml']) {
        this.modalService.showError('El mote no puede contener código HTML');
      } else if (validationResult['maliciousScript']) {
        this.modalService.showError('El mote contiene contenido potencialmente peligroso');
      } else if (validationResult['invalidCharacters']) {
        this.modalService.showError('El mote contiene caracteres no permitidos. Solo se permiten letras, números, espacios y algunos símbolos básicos (-, _, \', ., !, ?)');
      } else if (validationResult['maxLength']) {
        this.modalService.showError('El mote no puede exceder 20 caracteres');
      }
      return;
    }

    // Actualizar el nickname en el backend
    this.teamsService.updateTeamMemberNickname(
      this.team.id,
      this.selectedPokemon.id,
      nicknameValue || undefined
    ).subscribe({
      next: () => {
        if (this.selectedPokemon) {
          this.selectedPokemon.nickname = nicknameValue || undefined;
        }
        this.editingNickname = false;
        this.modalService.showSuccess('Mote actualizado correctamente');
      },
      error: (error: any) => {
        this.modalService.showError(error.error?.detail || 'Error al actualizar el mote');
        this.cancelEditingNickname();
      }
    });
  }

  // Métodos para editar nivel
  startEditingLevel(): void {
    if (!this.selectedPokemon) return;
    this.editingLevel = true;
    this.tempLevel = this.selectedPokemon.level;
    setTimeout(() => this.levelInput?.nativeElement.focus(), 0);
  }

  cancelEditingLevel(): void {
    this.editingLevel = false;
    this.tempLevel = 50;
  }

  saveLevel(): void {
    if (!this.selectedPokemon || !this.team || !this.team.id) {
      this.cancelEditingLevel();
      return;
    }

    // Validar nivel
    if (this.tempLevel < 1 || this.tempLevel > 100) {
      this.modalService.showError('El nivel debe estar entre 1 y 100');
      return;
    }

    // Actualizar el nivel en el backend
    this.teamsService.updateTeamMemberLevel(
      this.team.id,
      this.selectedPokemon.id,
      this.tempLevel
    ).subscribe({
      next: () => {
        if (this.selectedPokemon) {
          this.selectedPokemon.level = this.tempLevel;
        }
        this.editingLevel = false;
        this.modalService.showSuccess('Nivel actualizado correctamente');
      },
      error: (error: any) => {
        this.modalService.showError(error.error?.detail || 'Error al actualizar el nivel');
        this.cancelEditingLevel();
      }
    });
  }
}

