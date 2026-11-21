import { Pokemon } from '../services/pokemon.service';

/** Optional backend enrichment for holo card face (tolerate absence — S5). */
export interface CardPresentation {
  artwork_url?: string | null;
  foil_style?: string | null;
}

export interface TeamPokemonItem {
  id?: number;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_sprite?: string | null;
  pokemon_types?: string[] | null;
  pokemon_artwork?: string | null;
  card_presentation?: CardPresentation | null;
  selected_ability: string;
  selectedAbility?: string;
  nickname?: string;
  level?: number;
  added_at?: string;
  pokemon?: Pokemon;
  evs?: {
    hp?: number;
    attack?: number;
    defense?: number;
    specialAttack?: number;
    specialDefense?: number;
    speed?: number;
  } | null;
}
