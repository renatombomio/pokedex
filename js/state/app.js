import {
    loadPokemonCollection
} from './api.js';


const INITIAL_LIMIT = 24;
const PAGE_SIZE = 24;


const state = {
    pokemon: [],
    filteredPokemon: [],

    selectedType: 'all',
    searchQuery: '',

    loading: false,
    error: null,

    offset: 0,
    hasMore: true
};


export async function initializeApp() {
    setState({
        loading: true,
        error: null,
        offset: 0
    });

    try {
        const pokemon = await loadPokemonCollection({
            limit: PAGE_SIZE,
            offset: 0
        });

        setState({
            pokemon,
            filteredPokemon: pokemon,
            loading: false,
            error: null,
            offset: PAGE_SIZE
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

export async function loadMorePokemon() {

    if (
        state.loading ||
        !state.hasMore
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

export function getState() {
    return {
        ...state,

        pokemon: [...state.pokemon],

        filteredPokemon: [
            ...state.filteredPokemon
        ]
    };
}


export function filterByType(type) {
    state.selectedType = type;

    applyFilters();

    return getState();
}


export function searchPokemon(query) {
    state.searchQuery = query
        .trim()
        .toLowerCase();

    applyFilters();

    return getState();
}


function applyFilters() {
    let results = [...state.pokemon];


    if (state.selectedType !== 'all') {
        results = results.filter(
            (pokemon) =>
                pokemon.types.some(
                    ({ type }) =>
                        type.name === state.selectedType
                )
        );
    }


    if (state.searchQuery) {
        results = results.filter(
            (pokemon) => {

                const nameMatches =
                    pokemon.name
                        .toLowerCase()
                        .includes(state.searchQuery);

                const idMatches =
                    String(pokemon.id)
                        .includes(state.searchQuery);

                return nameMatches || idMatches;
            }
        );
    }


    state.filteredPokemon = results;
}


function setState(updates) {
    Object.assign(
        state,
        updates
    );
}