import {
    loadPokemonCollection,
    loadPokemonByType,
    loadPokemonByPokedex,
    searchPokemonList
} from './api.js';

const INITIAL_LIMIT = 12;
const PAGE_SIZE = 12;

const state = {
    pokemon: [],
    filteredPokemon: [],
    filters: {
        type: 'all',
        region: null,
        generation: null
    },
    loading: false,
    error: null,
    offset: 0,
    hasMore: true
};

let filterRequestId = 0;
let searchRequestId = 0;

export async function initializeApp() {
    setState({
        loading: true,
        error: null,
        offset: 0,
        filters: createEmptyFilters(),
        hasMore: true
    });

    try {
        const pokemon = await loadPokemonCollection({ limit: INITIAL_LIMIT, offset: 0 });

        setState({
            pokemon,
            filteredPokemon: pokemon,
            loading: false,
            error: null,
            offset: INITIAL_LIMIT,
            hasMore: true
        });

        return getState();
    } catch (error) {
        console.error('Failed to initialize Pokédex:', error);
        setState({ loading: false, error });
        throw error;
    }
}

export async function loadMorePokemon() {
    if (state.loading || !state.hasMore || hasActiveFilters()) {
        return getState();
    }

    setState({ loading: true, error: null });

    try {
        const pokemon = await loadPokemonCollection({
            limit: PAGE_SIZE,
            offset: state.offset
        });

        if (pokemon.length === 0) {
            setState({ loading: false, hasMore: false });
            return getState();
        }

        state.pokemon.push(...pokemon);
        state.offset += PAGE_SIZE;
        state.filteredPokemon = [...state.pokemon];

        setState({ loading: false });
        return getState();
    } catch (error) {
        console.error('Failed to load more Pokémon:', error);
        setState({ loading: false, error });
        throw error;
    }
}

export async function filterByType(type) {
    state.filters.type = type || 'all';
    return applyFilters();
}

export async function filterByRegion({ name, pokedex, generation }) {
    if (!name || !pokedex) {
        throw new Error('A region name and Pokédex are required.');
    }

    state.filters.region = { name, pokedex, generation };
    return applyFilters();
}

export async function filterByGeneration(generation) {
    state.filters.generation = generation || null;
    return applyFilters();
}

export async function applyFilters() {
    const currentRequest = ++filterRequestId;

    if (!hasActiveFilters()) {
        state.filteredPokemon = [...state.pokemon];
        setState({ loading: false, error: null, hasMore: true });
        return getState();
    }

    setState({
        loading: true,
        error: null,
        hasMore: false
    });

    try {
        const datasets = [];

        if (state.filters.type !== 'all') {
            datasets.push(loadPokemonByType(state.filters.type));
        }

        if (state.filters.region) {
            datasets.push(loadPokemonByPokedex(state.filters.region.pokedex));
        }

        const resolved = await Promise.all(datasets);

        if (currentRequest !== filterRequestId) {
            return getState();
        }

        let result;

        if (resolved.length === 0) {
            result = [...state.pokemon];
        } else if (resolved.length === 1) {
            result = [...resolved[0]];
        } else {
            const [first, second] = resolved;
            const secondIds = new Set(second.map(({ id }) => id));
            result = first.filter(({ id }) => secondIds.has(id));
        }

        if (state.filters.generation) {
            result = result.filter((pokemon) =>
                pokemon.id >= state.filters.generation.start &&
                pokemon.id <= state.filters.generation.end
            );
        }

        state.filteredPokemon = result;

        setState({
            loading: false,
            error: null,
            hasMore: false
        });

        return getState();
    } catch (error) {
        if (currentRequest !== filterRequestId) {
            return getState();
        }

        console.error('Failed to apply Pokémon filters:', error);
        setState({ loading: false, error });
        throw error;
    }
}

export async function searchPokemon(query) {
    const searchQuery = query.trim().toLowerCase();

    if (!searchQuery) {
        return applyFilters();
    }

    const currentRequest = ++searchRequestId;

    setState({ loading: true, error: null });

    try {
        const results = await searchPokemonList(searchQuery);

        if (currentRequest !== searchRequestId) {
            return getState();
        }

        state.filteredPokemon = [...results];

        setState({ loading: false, error: null, hasMore: false });
        return getState();
    } catch (error) {
        if (currentRequest !== searchRequestId) {
            return getState();
        }

        console.error('Failed to search Pokémon:', error);
        setState({ loading: false, error });
        throw error;
    }
}

export function getState() {
    return {
        ...state,
        filters: {
            ...state.filters,
            region: state.filters.region
                ? { ...state.filters.region }
                : null
        },
        pokemon: [...state.pokemon],
        filteredPokemon: [...state.filteredPokemon]
    };
}

function hasActiveFilters() {
    return (
        state.filters.type !== 'all' ||
        Boolean(state.filters.region) ||
        Boolean(state.filters.generation)
    );
}

function createEmptyFilters() {
    return {
        type: 'all',
        region: null,
        generation: null
    };
}

function setState(updates) {
    Object.assign(state, updates);
}
