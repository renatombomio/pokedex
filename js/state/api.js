import {
    getPokemon,
    getPokemonList
} from '../api/pokemon.js';


/**
 * Load a collection of Pokémon with their complete data.
 *
 * PokéAPI first returns a list of references, so we then
 * resolve each Pokémon individually.
 */
export async function loadPokemonCollection({
    limit = 24,
    offset = 0
} = {}) {

    const response = await getPokemonList(
        limit,
        offset
    );

    const pokemon = await Promise.all(
        response.results.map(({ name }) =>
            getPokemon(name)
        )
    );

    return pokemon;
}


/**
 * Load a single Pokémon by name or Pokédex number.
 */
export async function loadPokemonDetails(
    nameOrId
) {
    return getPokemon(nameOrId);
}