export interface Interfaces {

}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface TrainingSession {
  id?: number;
  pokemonId: number;
  pokemonName: string;
  pokemonSprite: string;
  pokemonTypes: string[];
  baseStats: PokemonStats;      // Mantener como requerido
  currentEVs: PokemonStats;     // Mantener como requerido
  maxEVs: PokemonStats;         // Mantener como requerido
  trainingPoints: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface TrainingForm {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface TrainingValidation {
  isValid: boolean;
  errors: string[];
  totalPoints: number;
  remainingPoints: number;
}
