const STORAGE_KEY = 'gamedex-captured';

export function loadCapturedPokemon() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(stored)) return [];
        return [...new Set(stored.map(Number).filter(Number.isInteger))];
    } catch (error) {
        console.warn('Could not load captured Pokémon from localStorage:', error);
        return [];
    }
}

export function getCapturedPokemon() {
    return loadCapturedPokemon();
}

export function isPokemonCaptured(id) {
    const numericId = Number(id);
    return Number.isInteger(numericId) && loadCapturedPokemon().includes(numericId);
}

export function saveCapturedPokemon(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) return getCapturedPokemon();

    const captured = getCapturedPokemon();
    if (captured.includes(numericId)) return captured;

    const updated = [...captured, numericId];

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.warn('Could not save captured Pokémon to localStorage:', error);
    }

    return updated;
}
