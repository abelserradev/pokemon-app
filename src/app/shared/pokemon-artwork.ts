import { Pokemon } from '../services/pokemon.service';
import { CardPresentation, TeamPokemonItem } from './team-pokemon.types';

/** Prefer official / backend artwork; tolerate missing optional fields (S3, S5). */
export function resolvePokemonArtwork(source: {
  cardPresentation?: CardPresentation | null;
  pokemonArtwork?: string | null;
  pokemon?: Pokemon | null;
  pokemonSprite?: string | null;
}): string {
  const fromPresentation = source.cardPresentation?.artwork_url?.trim();
  if (fromPresentation) {
    return fromPresentation;
  }

  const fromBackendArt = source.pokemonArtwork?.trim();
  if (fromBackendArt) {
    return fromBackendArt;
  }

  const official =
    source.pokemon?.sprites?.other?.['official-artwork']?.front_default?.trim();
  if (official) {
    return official;
  }

  const front = source.pokemon?.sprites?.front_default?.trim();
  if (front) {
    return front;
  }

  return source.pokemonSprite?.trim() || '';
}

export function resolveArtworkFromTeamItem(item: TeamPokemonItem): string {
  return resolvePokemonArtwork({
    cardPresentation: item.card_presentation,
    pokemonArtwork: item.pokemon_artwork,
    pokemon: item.pokemon,
    pokemonSprite: item.pokemon_sprite
  });
}

export function typeNamesFromPokemon(pokemon: Pokemon | null | undefined): string[] {
  if (!pokemon?.types?.length) {
    return [];
  }
  return pokemon.types.map((t) => t.type.name);
}

export function typeNamesFromTeamItem(item: TeamPokemonItem): string[] {
  const fromPokemon = typeNamesFromPokemon(item.pokemon);
  if (fromPokemon.length) {
    return fromPokemon;
  }
  return item.pokemon_types ?? [];
}
