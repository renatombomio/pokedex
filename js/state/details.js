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
 * Load all data required by the Pokémon detail view.
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
 * Return the evolution tree without flattening branching families.
 */
export function getEvolutionTree() {
    if (!state.evolution?.chain) {
        return null;
    }

    return mapEvolutionNode(state.evolution.chain);
}


/**
 * Return a flat list for consumers that only need the Pokémon in the chain.
 */
export function getEvolutionList() {
    const tree = getEvolutionTree();
    const evolutionList = [];

    function walk(node) {
        if (!node) return;
        evolutionList.push(node.pokemon);
        node.children.forEach(walk);
    }

    walk(tree);
    return evolutionList;
}


function mapEvolutionNode(node) {
    if (!node?.species) {
        return null;
    }

    return {
        pokemon: {
            id: getIdFromUrl(node.species.url),
            name: node.species.name,
            url: node.species.url
        },
        children: (node.evolves_to ?? [])
            .map(mapEvolutionNode)
            .filter(Boolean)
    };
}


function getIdFromUrl(url) {
    if (!url) {
        return null;
    }

    const parts = url.split('/').filter(Boolean);
    const id = Number(parts[parts.length - 1]);

    return Number.isInteger(id) ? id : null;
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
