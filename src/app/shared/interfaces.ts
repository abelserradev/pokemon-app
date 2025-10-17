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

// Interfaces actualizadas para equipos Pokémon según el backend
export interface PokemonTeamMemberCreate {
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite?: string;
  pokemon_types?: string[];
  nickname?: string;
  level?: number;
  selected_ability?: string;
  position: number;  // 1-6
  move_1?: string;
  move_2?: string;
  move_3?: string;
  move_4?: string;
  held_item?: string;
  nature?: string;
  evs?: { [key: string]: number };
  ivs?: { [key: string]: number };
}

export interface PokemonTeamMemberResponse {
  id: number;
  team_id: number;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite?: string;
  pokemon_types?: string[];
  nickname?: string;
  level: number;
  selected_ability?: string;
  position: number;
  move_1?: string;
  move_2?: string;
  move_3?: string;
  move_4?: string;
  held_item?: string;
  nature?: string;
  evs?: { [key: string]: number };
  ivs?: { [key: string]: number };
  added_at: string;
}

export interface PokemonTeam {
  id?: number;
  user_id?: number;
  team_name: string;
  description?: string;
  is_favorite: boolean;
  team_members: PokemonTeamMemberResponse[];
  created_at: string;
  updated_at?: string;
}

export interface PokemonTeamCreate {
  team_name: string;
  description?: string;
  is_favorite?: boolean;
  team_members: PokemonTeamMemberCreate[];
}

export interface PokemonTeamUpdate {
  team_name?: string;
  description?: string;
  is_favorite?: boolean;
  team_members?: PokemonTeamMemberCreate[];
}