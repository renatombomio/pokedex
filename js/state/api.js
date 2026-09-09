import {
    getPokemon,
    getPokemonList,
    getPokemonByType,
    getPokedex
} from '../api/pokemon.js';

export async function loadPokemonCollection({ limit = 24, offset = 0 } = {}) {
    const response = await getPokemonList(limit, offset);

    return Promise.all(
        response.results.map(({ name }) => getPokemon(name))
    );
}

export async function loadPokemonByType(type) {
    const response = await getPokemonByType(type);

    return Promise.all(
        response.pokemon.map(({ pokemon }) => getPokemon(pokemon.name))
    );
}

export async function loadPokemonByPokedex(pokedex) {
    const response = await getPokedex(pokedex);

    return Promise.all(
        response.pokemon_entries.map(({ pokemon_species }) =>
            getPokemon(pokemon_species.name)
        )
    );
}

/**
 * Load the base Pokédex entries belonging to a generation.
 * Generation boundaries map directly to National Pokédex IDs.
 */
export async function loadPokemonByGeneration({ start, end }) {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
        throw new Error('A valid generation range is required.');
    }

    const response = await getPokemonList(end - start + 1, start - 1);

    return Promise.all(
        response.results.map(({ name }) => getPokemon(name))
    );
}

export async function searchPokemonList(query) {
    const searchQuery = query.trim().toLowerCase();
    if (!searchQuery) return [];

    const response = await getPokemonList(2000, 0);
    const matches = response.results.filter(({ name, url }) => {
        const id = url.split('/').filter(Boolean).pop();
        return (
            name.toLowerCase().includes(searchQuery) ||
            String(id).includes(searchQuery)
        );
    });

    return Promise.all(matches.map(({ name }) => getPokemon(name)));
}

export async function loadPokemonDetails(nameOrId) {
    return getPokemon(nameOrId);
}
