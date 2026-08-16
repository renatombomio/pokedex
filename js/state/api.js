import {
    getPokemon,
    getPokemonList,
    getPokemonByType
} from '../api/pokemon.js';


/**
 * Load a collection of Pokémon with their complete data.
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
 * Load all Pokémon belonging to a specific type.
 */
export async function loadPokemonByType(type) {

    const response =
        await getPokemonByType(type);

    const pokemon = await Promise.all(
        response.pokemon.map(
            ({ pokemon }) =>
                getPokemon(pokemon.name)
        )
    );

    return pokemon;
}


/**
 * Search Pokémon globally.
 *
 * This searches the complete PokéAPI list,
 * so Pokémon variants are also found.
 */
export async function searchPokemonList(query) {

    const searchQuery =
        query
            .trim()
            .toLowerCase();


    if (!searchQuery) {
        return [];
    }


    const response =
        await getPokemonList(
            2000,
            0
        );


    const matches =
        response.results.filter(
            ({ name, url }) => {

                const id =
                    url
                        .split('/')
                        .filter(Boolean)
                        .pop();

                const nameMatches =
                    name
                        .toLowerCase()
                        .includes(
                            searchQuery
                        );

                const idMatches =
                    String(id)
                        .includes(
                            searchQuery
                        );

                return (
                    nameMatches ||
                    idMatches
                );
            }
        );


    const pokemon =
        await Promise.all(
            matches.map(
                ({ name }) =>
                    getPokemon(name)
            )
        );


    return pokemon;
}


/**
 * Load a single Pokémon.
 */
export async function loadPokemonDetails(
    nameOrId
) {
    return getPokemon(nameOrId);
}