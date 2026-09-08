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


/**
 * Load all data required for the Pokémon detail view.
 */
export async function loadPokemonDetails(identifier) {
    state.loading = true;
    state.error = null;

    try {
        const pokemon = await getPokemon(identifier);
        const species = await getPokemonSpecies(pokemon.species.url);
        const evolution = await getEvolutionChain(species.evolution_chain.url);

        state.pokemon = pokemon;
        state.species = species;
        state.evolution = evolution;
        state.loading = false;

        return getDetailsState();
    } catch (error) {
        console.error('Failed to load Pokémon details:', error);
        state.loading = false;
        state.error = error;
        throw error;
    }
}


/**
 * Get the current detail state.
 */
export function getDetailsState() {
    return {
        ...state
    };
}


/**
 * Flatten the PokéAPI evolution chain into render-ready entries.
 */
export function getEvolutionList() {
    if (!state.evolution?.chain) {
        return [];
    }

    const evolutionList = [];

    function walk(chain) {
        if (!chain) {
            return;
        }

        if (chain.species) {
            evolutionList.push({
                id: getIdFromUrl(chain.species.url),
                name: chain.species.name,
                url: chain.species.url
            });
        }

        chain.evolves_to?.forEach(walk);
    }

    walk(state.evolution.chain);
    return evolutionList;
}


function getIdFromUrl(url) {
    if (!url) {
        return null;
    }

    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
}


/**
 * Clear the current detail state.
 */
export function clearDetails() {
    state.pokemon = null;
    state.species = null;
    state.evolution = null;
    state.loading = false;
    state.error = null;
}
