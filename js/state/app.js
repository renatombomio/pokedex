import {
    loadPokemonCollection,
    loadPokemonByType,
    loadPokemonByPokedex,
    searchPokemonList
} from './api.js';


/*
 * Keep the initial payload intentionally small.
 * Cards can appear sooner, especially on slower
 * connections and mobile devices.
 */
const INITIAL_LIMIT = 12;
const PAGE_SIZE = 12;


const state = {
    pokemon: [],
    filteredPokemon: [],

    selectedType: 'all',
    selectedRegion: null,

    loading: false,
    error: null,

    offset: 0,
    hasMore: true
};


/**
 * Initialize the application.
 */
export async function initializeApp() {

    setState({
        loading: true,
        error: null,
        offset: 0,
        selectedType: 'all',
        selectedRegion: null
    });

    try {

        const pokemon =
            await loadPokemonCollection({
                limit: INITIAL_LIMIT,
                offset: 0
            });

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

        console.error(
            'Failed to initialize Pokédex:',
            error
        );

        setState({
            loading: false,
            error
        });

        throw error;
    }
}


/**
 * Load the next Pokémon batch.
 */
export async function loadMorePokemon() {

    if (
        state.loading ||
        !state.hasMore ||
        state.selectedType !== 'all' ||
        state.selectedRegion
    ) {
        return getState();
    }

    setState({
        loading: true,
        error: null
    });

    try {

        const pokemon =
            await loadPokemonCollection({
                limit: PAGE_SIZE,
                offset: state.offset
            });

        if (pokemon.length === 0) {

            setState({
                loading: false,
                hasMore: false
            });

            return getState();
        }

        state.pokemon.push(
            ...pokemon
        );

        state.offset += PAGE_SIZE;

        /*
         * Render the complete loaded collection.
         */
        state.filteredPokemon = [
            ...state.pokemon
        ];

        setState({
            loading: false
        });

        return getState();

    } catch (error) {

        console.error(
            'Failed to load more Pokémon:',
            error
        );

        setState({
            loading: false,
            error
        });

        throw error;
    }
}


/**
 * Filter Pokémon by type.
 *
 * The type filter is completely independent
 * from the search field and region selection.
 */
export async function filterByType(type) {

    state.selectedType = type;
    state.selectedRegion = null;


    /*
     * "All" shows the Pokémon already loaded.
     */
    if (type === 'all') {

        state.filteredPokemon = [
            ...state.pokemon
        ];

        return getState();
    }


    setState({
        loading: true,
        error: null
    });


    try {

        const pokemon =
            await loadPokemonByType(type);

        state.filteredPokemon = [
            ...pokemon
        ];

        setState({
            loading: false,
            error: null
        });

        return getState();

    } catch (error) {

        console.error(
            `Failed to filter Pokémon by type "${type}":`,
            error
        );

        setState({
            loading: false,
            error
        });

        throw error;
    }
}


/**
 * Filter Pokémon by regional Pokédex.
 */
export async function filterByRegion({
    name,
    pokedex,
    generation
}) {

    if (!name || !pokedex) {
        throw new Error(
            'A region name and Pokédex are required.'
        );
    }

    setState({
        loading: true,
        error: null,
        selectedType: 'all',
        selectedRegion: {
            name,
            pokedex,
            generation
        },
        hasMore: false
    });

    try {

        const pokemon =
            await loadPokemonByPokedex(pokedex);

        state.filteredPokemon = [
            ...pokemon
        ];

        setState({
            loading: false,
            error: null,
            offset: 0,
            hasMore: false
        });

        return getState();

    } catch (error) {

        console.error(
            `Failed to load region "${name}":`,
            error
        );

        setState({
            loading: false,
            error
        });

        throw error;
    }
}


/**
 * Search Pokémon.
 *
 * This is a one-time action.
 *
 * The search query is NOT stored in state,
 * so it cannot affect future filters.
 */
export async function searchPokemon(query) {

    const searchQuery =
        query
            .trim()
            .toLowerCase();


    if (!searchQuery) {

        if (
            state.selectedType === 'all' &&
            !state.selectedRegion
        ) {

            state.filteredPokemon = [
                ...state.pokemon
            ];

            return getState();
        }

        if (state.selectedRegion) {
            return filterByRegion(state.selectedRegion);
        }

        return filterByType(
            state.selectedType
        );
    }


    setState({
        loading: true,
        error: null
    });


    try {

        const results =
            await searchPokemonList(
                searchQuery
            );

        state.filteredPokemon = [
            ...results
        ];

        setState({
            loading: false,
            error: null
        });

        return getState();

    } catch (error) {

        console.error(
            'Failed to search Pokémon:',
            error
        );

        setState({
            loading: false,
            error
        });

        throw error;
    }
}


/**
 * Get a safe copy of the application state.
 */
export function getState() {

    return {
        ...state,

        pokemon: [
            ...state.pokemon
        ],

        filteredPokemon: [
            ...state.filteredPokemon
        ]
    };
}


/**
 * Update application state.
 */
function setState(updates) {

    Object.assign(
        state,
        updates
    );
}