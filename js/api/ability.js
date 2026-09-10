import { cachedRequest } from './cache.js';

const API_BASE_URL = 'https://pokeapi.co/api/v2';

async function request(endpoint) {
    const url = `${API_BASE_URL}${endpoint}`;
    return cachedRequest(url, async () => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`PokéAPI request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    });
}

export async function getAbility(nameOrId) {
    if (!nameOrId) throw new Error('An ability name, ID or URL is required.');
    const value = String(nameOrId).trim();
    if (value.startsWith('http')) {
        return cachedRequest(value, async () => {
            const response = await fetch(value);
            if (!response.ok) throw new Error(`Ability request failed: ${response.status}`);
            return response.json();
        });
    }
    return request(`/ability/${value.toLowerCase()}`);
}
