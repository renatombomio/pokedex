import {
    getPokemon,
    getPokemonList,
    getPokemonByType,
    getPokedex
} from '../api/pokemon.js';

const HYDRATION_CONCURRENCY = 8;

/**
 * Hydrate a list of PokéAPI references without opening an unbounded number
 * of simultaneous requests. Result order always matches the input order.
 */
async function hydratePokemon(references, concurrency = HYDRATION_CONCURRENCY) {
    const results = new Array(references.length);
    let nextIndex = 0;

    async function worker() {
        while (true) {
            const index = nextIndex++;
            if (index >= references.length) return;

            results[index] = await getPokemon(references[index]);
        }
    }

    const workerCount = Math.min(
        Math.max(1, concurrency),
        references.length
    );

    await Promise.all(
        Array.from({ length: workerCount }, () => worker())
    );

    return results;
}

export async function loadPokemonCollection({ limit = 24, offset = 0 } = {}) {
    const response = await getPokemonList(limit, offset);

    return hydratePokemon(
        response.results.map(({ name }) => name)
    );
}

export async function loadPokemonByType(type) {
    const response = await getPokemonByType(type);

    return hydratePokemon(
        response.pokemon.map(({ pokemon }) => pokemon.name)
    );
}

export async function loadPokemonByPokedex(pokedex) {
    const response = await getPokedex(pokedex);

    return hydratePokemon(
        response.pokemon_entries.map(({ pokemon_species }) => pokemon_species.name)
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

    return hydratePokemon(
        response.results.map(({ name }) => name)
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

    return hydratePokemon(
        matches.map(({ name }) => name)
    );
}

export async function loadPokemonDetails(nameOrId) {
    return getPokemon(nameOrId);
}
