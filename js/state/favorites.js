const STORAGE_KEY = 'pokedex-favorites';


/**
 * Load favorite Pokémon IDs from browser storage.
 */
export function loadFavorites() {
    try {
        const stored = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || '[]'
        );

        if (!Array.isArray(stored)) {
            return [];
        }

        return stored
            .map(Number)
            .filter(Number.isInteger);

    } catch (error) {
        console.warn(
            'Could not load favorites from localStorage:',
            error
        );

        return [];
    }
}


/**
 * Save favorite Pokémon IDs to browser storage.
 */
export function saveFavorites(favoriteIds) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(favoriteIds)
        );

        return true;

    } catch (error) {
        console.warn(
            'Could not save favorites to localStorage:',
            error
        );

        return false;
    }
}


/**
 * Get the current favorite Pokémon IDs.
 */
export function getFavorites() {
    return loadFavorites();
}


/**
 * Check whether a Pokémon is a favorite.
 */
export function isFavorite(id) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId)) {
        return false;
    }

    return loadFavorites().includes(numericId);
}


/**
 * Add a Pokémon to favorites.
 */
export function addFavorite(id) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId)) {
        return getFavorites();
    }

    const favorites = getFavorites();

    if (favorites.includes(numericId)) {
        return favorites;
    }

    const updatedFavorites = [
        ...favorites,
        numericId
    ];

    saveFavorites(updatedFavorites);

    return updatedFavorites;
}


/**
 * Remove a Pokémon from favorites.
 */
export function removeFavorite(id) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId)) {
        return getFavorites();
    }

    const updatedFavorites = getFavorites().filter(
        (favoriteId) => favoriteId !== numericId
    );

    saveFavorites(updatedFavorites);

    return updatedFavorites;
}


/**
 * Toggle a Pokémon favorite state.
 */
export function toggleFavorite(id) {
    return isFavorite(id)
        ? removeFavorite(id)
        : addFavorite(id);
}
