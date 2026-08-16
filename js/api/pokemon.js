const API_BASE_URL =
    'https://pokeapi.co/api/v2';


/**
 * Base API request.
 */
async function request(endpoint) {

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`
    );

    if (!response.ok) {

        throw new Error(
            `PokéAPI request failed: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
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

        const response =
            await fetch(value);

        if (!response.ok) {

            throw new Error(
                `Pokémon request failed: ${response.status} ${response.statusText}`
            );
        }

        return response.json();
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

        const response =
            await fetch(value);

        if (!response.ok) {

            throw new Error(
                `Species request failed: ${response.status} ${response.statusText}`
            );
        }

        return response.json();
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

        const response =
            await fetch(value);

        if (!response.ok) {

            throw new Error(
                `Evolution chain request failed: ${response.status} ${response.statusText}`
            );
        }

        return response.json();
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