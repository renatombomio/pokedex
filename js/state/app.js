import {
    loadPokemonCollection,
    loadPokemonByType,
    searchPokemonList
} from './api.js';


const INITIAL_LIMIT = 24;
const PAGE_SIZE = 24;


const state = {
    pokemon: [],
    filteredPokemon: [],

    selectedType: 'all',

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
        selectedType: 'all'
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
        state.selectedType !== 'all'
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
 * from the search field.
 */
export async function filterByType(type) {

    state.selectedType = type;


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

        /*
         * Get all Pokémon belonging to this type
         * directly from PokéAPI.
         */
        const pokemon =
            await loadPokemonByType(type);


        /*
         * The search field is completely ignored.
         */
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


    /*
     * Empty search.
     */
    if (!searchQuery) {

        if (
            state.selectedType === 'all'
        ) {

            state.filteredPokemon = [
                ...state.pokemon
            ];

            return getState();
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

        /*
         * Search the complete PokéAPI collection.
         *
         * This can return Pokémon variants,
         * such as the different Pikachu forms.
         */
        const results =
            await searchPokemonList(
                searchQuery
            );


        /*
         * Display search results directly.
         *
         * The selected type is NOT applied.
         */
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