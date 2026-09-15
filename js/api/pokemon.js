import { cachedRequest } from './cache.js';

const API_BASE_URL =
    'https://pokeapi.co/api/v2';
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 2;

function isRetryableStatus(status) {
    return status === 408 || status === 429 || status >= 500;
}

function createTimeoutError() {
    const error = new Error('La petición a PokéAPI ha tardado demasiado.');
    error.code = 'API_TIMEOUT';
    return error;
}

async function fetchJson(url) {
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const response = await fetch(url, { signal: controller.signal });

            if (response.ok) return response.json();

            const error = new Error(
                `PokéAPI request failed: ${response.status} ${response.statusText}`
            );
            error.status = response.status;

            if (!isRetryableStatus(response.status)) throw error;

            lastError = error;
            if (attempt === MAX_RETRIES) throw error;
        } catch (error) {
            if (error.status && !isRetryableStatus(error.status)) throw error;

            lastError = error.name === 'AbortError'
                ? createTimeoutError()
                : error;

            if (attempt === MAX_RETRIES) throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }

        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }

    throw lastError ?? new Error('PokéAPI request failed.');
}

async function request(endpoint) {
    const url = `${API_BASE_URL}${endpoint}`;

    return cachedRequest(
        url,
        () => fetchJson(url)
    );
}

async function requestUrl(url, resourceName) {
    return cachedRequest(
        url,
        async () => {
            try {
                return await fetchJson(url);
            } catch (error) {
                if (error.status) {
                    error.message = `${resourceName} request failed: ${error.status}`;
                }
                throw error;
            }
        }
    );
}

/**
 * Load a Pokémon by name or ID.
 */
export async function getPokemon(nameOrId) {
    if (!nameOrId) {
        throw new Error('A Pokémon name or ID is required.');
    }

    const value = String(nameOrId).trim();

    if (value.startsWith('http')) {
        return requestUrl(value, 'Pokémon');
    }

    return request(`/pokemon/${value.toLowerCase()}`);
}

/**
 * Load a paginated Pokémon list.
 */
export async function getPokemonList(limit = 24, offset = 0) {
    return request(`/pokemon?limit=${limit}&offset=${offset}`);
}

/**
 * Load Pokémon belonging to a specific type.
 */
export async function getPokemonByType(type) {
    if (!type) {
        throw new Error('A Pokémon type is required.');
    }

    const identifier = String(type).trim().toLowerCase();
    return request(`/type/${identifier}`);
}

/**
 * Load a Pokémon region.
 */
export async function getRegion(nameOrId) {
    if (!nameOrId) {
        throw new Error('A region name or ID is required.');
    }

    const value = String(nameOrId).trim();

    if (value.startsWith('http')) {
        return requestUrl(value, 'Region');
    }

    return request(`/region/${value.toLowerCase()}`);
}

/**
 * Load a regional Pokédex.
 */
export async function getPokedex(nameOrId) {
    if (!nameOrId) {
        throw new Error('A Pokédex name or ID is required.');
    }

    const value = String(nameOrId).trim();

    if (value.startsWith('http')) {
        return requestUrl(value, 'Pokédex');
    }

    return request(`/pokedex/${value.toLowerCase()}`);
}

/**
 * Load Pokémon species information.
 */
export async function getPokemonSpecies(nameOrId) {
    if (!nameOrId) {
        throw new Error('A Pokémon species name, ID or URL is required.');
    }

    const value = String(nameOrId).trim();

    if (value.startsWith('http')) {
        return requestUrl(value, 'Species');
    }

    return request(`/pokemon-species/${value.toLowerCase()}`);
}

/**
 * Load an evolution chain.
 */
export async function getEvolutionChain(idOrUrl) {
    if (!idOrUrl) {
        throw new Error('An evolution chain ID or URL is required.');
    }

    const value = String(idOrUrl).trim();

    if (value.startsWith('http')) {
        return requestUrl(value, 'Evolution chain');
    }

    const identifier = value
        .toLowerCase()
        .replace('/evolution-chain/', '')
        .replace(/\//g, '');

    return request(`/evolution-chain/${identifier}`);
}
