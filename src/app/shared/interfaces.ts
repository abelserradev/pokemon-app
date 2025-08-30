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
  pokemonId: number;
  pokemonName: string;
  pokemonSprite: string;
  pokemonTypes: string[];
  baseStats: PokemonStats;
  currentEVs: PokemonStats;
  maxEVs: PokemonStats;
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
