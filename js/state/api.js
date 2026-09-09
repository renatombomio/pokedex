import {
    getPokemon,
    getPokemonList,
    getPokemonByType,
    getPokedex
} from '../api/pokemon.js';

const HYDRATION_CONCURRENCY = 8;
const SEARCH_RESULT_LIMIT = 24;

/**
 * Hydrate a list of PokéAPI references without opening an unbounded number
 * of simultaneous requests. Result order always matches the input order.
 *
 * A caller can stop starting new work when its request becomes obsolete.
 * Already-running requests are intentionally allowed to finish because they
 * are shared by the API cache and may still be useful to the next view.
 */
async function hydratePokemon(
    references,
    concurrency = HYDRATION_CONCURRENCY,
    shouldContinue = () => true
) {
    const results = new Array(references.length);
    let nextIndex = 0;

    async function worker() {
        while (shouldContinue()) {
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

    return results.filter(Boolean);
}

function extractId(url) {
    const id = Number(url.split('/').filter(Boolean).pop());
    return Number.isInteger(id) ? id : null;
}

function extractReferences(response, collectionKey) {
    return response[collectionKey]
        .map((entry) => entry.name ? entry : entry.pokemon ?? entry.pokemon_species)
        .filter(Boolean)
        .map(({ name, url }) => ({ name, id: extractId(url) }))
        .filter(({ name, id }) => name && id !== null);
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
 * Return lightweight references for a type without hydrating every Pokémon.
 * This is used when several filters are combined so only the final
 * intersection needs full Pokémon payloads.
 */
export async function loadPokemonReferencesByType(type) {
    const response = await getPokemonByType(type);
    return extractReferences(response, 'pokemon');
}

/**
 * Return lightweight references for a Pokédex without hydrating every Pokémon.
 */
export async function loadPokemonReferencesByPokedex(pokedex) {
    const response = await getPokedex(pokedex);
    return extractReferences(response, 'pokemon_entries');
}

/**
 * Return lightweight references for a generation without hydrating every
 * Pokémon. Generation boundaries map directly to National Pokédex IDs.
 */
export async function loadPokemonReferencesByGeneration({ start, end }) {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
        throw new Error('A valid generation range is required.');
    }

    const response = await getPokemonList(end - start + 1, start - 1);

    return response.results
        .map(({ name, url }) => ({ name, id: extractId(url) }))
        .filter(({ name, id }) => name && id !== null);
}

export async function loadPokemonByGeneration({ start, end }) {
    return hydratePokemon(
        (await loadPokemonReferencesByGeneration({ start, end })).map(({ name }) => name)
    );
}

export async function hydratePokemonReferences(
    references,
    shouldContinue = () => true
) {
    return hydratePokemon(
        references.map(({ name }) => name),
        HYDRATION_CONCURRENCY,
        shouldContinue
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
        matches
            .slice(0, SEARCH_RESULT_LIMIT)
            .map(({ name }) => name)
    );
}

export async function loadPokemonDetails(nameOrId) {
    return getPokemon(nameOrId);
}
