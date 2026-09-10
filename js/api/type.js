import { cachedRequest } from './cache.js';

const API_BASE_URL = 'https://pokeapi.co/api/v2';

const typeCache = new Map();

export async function getType(nameOrId) {
    const identifier = String(nameOrId ?? '').trim().toLowerCase();
    if (!identifier) throw new Error('A Pokémon type is required.');

    if (!typeCache.has(identifier)) {
        const url = `${API_BASE_URL}/type/${identifier}`;
        typeCache.set(identifier, cachedRequest(url, async () => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Type request failed: ${response.status} ${response.statusText}`);
            }
            return response.json();
        }));
    }

    return typeCache.get(identifier);
}
