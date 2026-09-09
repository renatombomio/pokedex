import { cachedRequest } from './cache.js';

const API_BASE_URL =
    'https://pokeapi.co/api/v2';


/**
 * Base API request.
 *
 * All PokéAPI requests pass through the shared cache layer so repeated
 * requests reuse completed responses and concurrent requests are deduplicated.
 */
async function request(endpoint) {

    const url =
        `${API_BASE_URL}${endpoint}`;

    return cachedRequest(
        url,
        async () => {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `PokéAPI request failed: ${response.status} ${response.statusText}`
                );
            }

            return response.json();
        }
    );
}


/**
 * Load a Pokémon by name or ID.
 */
export async function getPokemon(nameOrId) {

    if (!nameOrId) {

        throw new Error(
            'A Pokémon name or ID is required.'
        );
    }

    const value =
        String(nameOrId).trim();

    if (value.startsWith('http')) {

        return cachedRequest(
            value,
            async () => {
                const response = await fetch(value);

                if (!response.ok) {
                    throw new Error(
                        `Pokémon request failed: ${response.status} ${response.statusText}`
                    );
                }

                return response.json();
            }
        );
    }

    const identifier =
        value.toLowerCase();

    return request(
        `/pokemon/${identifier}`
    );
}


/**
 * Load a paginated Pokémon list.
 */
export async function getPokemonList(
    limit = 24,
    offset = 0
) {

    return request(
        `/pokemon?limit=${limit}&offset=${offset}`
    );
}


/**
 * Load Pokémon belonging to a specific type.
 */
export async function getPokemonByType(type) {

    if (!type) {

        throw new Error(
            'A Pokémon type is required.'
        );
    }

    const identifier =
        String(type)
            .trim()
            .toLowerCase();

    return request(
        `/type/${identifier}`
    );
}


/**
 * Load a Pokémon region.
 */
export async function getRegion(nameOrId) {

    if (!nameOrId) {

        throw new Error(
            'A region name or ID is required.'
        );
    }

    const value =
        String(nameOrId).trim();

    if (value.startsWith('http')) {

        return cachedRequest(
            value,
            async () => {
                const response = await fetch(value);

                if (!response.ok) {
                    throw new Error(
                        `Region request failed: ${response.status} ${response.statusText}`
                    );
                }

                return response.json();
            }
        );
    }

    return request(
        `/region/${value.toLowerCase()}`
    );
}


/**
 * Load a regional Pokédex.
 */
export async function getPokedex(nameOrId) {

    if (!nameOrId) {

        throw new Error(
            'A Pokédex name or ID is required.'
        );
    }

    const value =
        String(nameOrId).trim();

    if (value.startsWith('http')) {

        return cachedRequest(
            value,
            async () => {
                const response = await fetch(value);

                if (!response.ok) {
                    throw new Error(
                        `Pokédex request failed: ${response.status} ${response.statusText}`
                    );
                }

                return response.json();
            }
        );
    }

    return request(
        `/pokedex/${value.toLowerCase()}`
    );
}


/**
 * Load Pokémon species information.
 */
export async function getPokemonSpecies(
    nameOrId
) {

    if (!nameOrId) {

        throw new Error(
            'A Pokémon species name, ID or URL is required.'
        );
    }

    const value =
        String(nameOrId).trim();

    /*
     * PokéAPI sometimes gives us the complete
     * species URL directly.
     */
    if (value.startsWith('http')) {

        return cachedRequest(
            value,
            async () => {
                const response = await fetch(value);

                if (!response.ok) {
                    throw new Error(
                        `Species request failed: ${response.status} ${response.statusText}`
                    );
                }

                return response.json();
            }
        );
    }

    const identifier =
        value.toLowerCase();

    return request(
        `/pokemon-species/${identifier}`
    );
}


/**
 * Load an evolution chain.
 */
export async function getEvolutionChain(
    idOrUrl
) {

    if (!idOrUrl) {

        throw new Error(
            'An evolution chain ID or URL is required.'
        );
    }

    const value =
        String(idOrUrl).trim();

    /*
     * Evolution chain URL.
     */
    if (value.startsWith('http')) {

        return cachedRequest(
            value,
            async () => {
                const response = await fetch(value);

                if (!response.ok) {
                    throw new Error(
                        `Evolution chain request failed: ${response.status} ${response.statusText}`
                    );
                }

                return response.json();
            }
        );
    }

    const identifier =
        value
            .toLowerCase()
            .replace(
                '/evolution-chain/',
                ''
            )
            .replace(
                /\//g,
                ''
            );

    return request(
        `/evolution-chain/${identifier}`
    );
}
