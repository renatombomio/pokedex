import {
    getPokemon,
    getPokemonSpecies,
    getEvolutionChain
} from '../api/pokemon.js';


const state = {
    pokemon: null,
    species: null,
    evolution: null,

    loading: false,
    error: null
};


export async function loadPokemonDetails(identifier) {
    state.loading = true;
    state.error = null;

    try {
        const pokemon =
            await getPokemon(identifier);

        const species =
            await getPokemonSpecies(
                pokemon.species.url
            );

        const evolution =
            await getEvolutionChain(
                species.evolution_chain.url
            );

        state.pokemon = pokemon;
        state.species = species;
        state.evolution = evolution;
        state.loading = false;

        return getDetailsState();

    } catch (error) {

        console.error(
            'Failed to load Pokémon details:',
            error
        );

        state.loading = false;
        state.error = error;

        throw error;
    }
}


export function getDetailsState() {
    return {
        ...state
    };
}


export function clearDetails() {
    state.pokemon = null;
    state.species = null;
    state.evolution = null;

    state.loading = false;
    state.error = null;
}