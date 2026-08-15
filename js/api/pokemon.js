const API_BASE_URL = 'https://pokeapi.co/api/v2';

async function request(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);

    if (!response.ok) {
        throw new Error(
            `PokéAPI request failed: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

export async function getPokemon(nameOrId) {
    if (!nameOrId) {
        throw new Error('A Pokémon name or ID is required.');
    }

    const identifier = String(nameOrId).trim().toLowerCase();

    return request(`/pokemon/${identifier}`);
}