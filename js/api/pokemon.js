const API_BASE_URL = 'https://pokeapi.co/api/v2';


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
 * Fetch a Pokémon by name or Pokédex number.
 */
export async function getPokemon(nameOrId) {

    if (!nameOrId) {
        throw new Error(
            'A Pokémon name or ID is required.'
        );
    }

    const identifier =
        String(nameOrId)
            .trim()
            .toLowerCase();

    return request(
        `/pokemon/${identifier}`
    );
}


/**
 * Fetch the complete Pokémon list.
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
 * Fetch Pokémon species information.
 *
 * Species data contains information that is not
 * available through the standard Pokémon endpoint,
 * such as evolution chains, generation and
 * legendary/mythical classification.
 */
export async function getPokemonSpecies(
    urlOrId
) {

    if (!urlOrId) {
        throw new Error(
            'A Pokémon species URL or ID is required.'
        );
    }

    /*
     * PokéAPI gives us the species URL directly
     * through pokemon.species.url.
     */
    if (String(urlOrId).startsWith('http')) {

        const response = await fetch(
            urlOrId
        );

        if (!response.ok) {
            throw new Error(
                `PokéAPI species request failed: ${response.status} ${response.statusText}`
            );
        }

        return response.json();
    }

    return request(
        `/pokemon-species/${urlOrId}`
    );
}


/**
 * Fetch a Pokémon evolution chain.
 */
export async function getEvolutionChain(
    url
) {

    if (!url) {
        throw new Error(
            'An evolution chain URL is required.'
        );
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `PokéAPI evolution request failed: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}