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

export function getDetailsState() {
    return { ...state };
}

export function getEvolutionTree() {
    if (!state.evolution?.chain) return null;
    return mapEvolutionNode(state.evolution.chain);
}

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
    if (!node?.species) return null;

    return {
        pokemon: {
            id: getIdFromUrl(node.species.url),
            name: node.species.name,
            url: node.species.url
        },
        evolutionDetails: Array.isArray(node.evolution_details)
            ? node.evolution_details.map(mapEvolutionDetail)
            : [],
        children: (node.evolves_to ?? [])
            .map(mapEvolutionNode)
            .filter(Boolean)
    };
}

function mapEvolutionDetail(detail) {
    if (!detail) return null;

    return {
        trigger: detail.trigger?.name ?? null,
        minLevel: detail.min_level ?? null,
        item: detail.item?.name ?? null,
        heldItem: detail.held_item?.name ?? null,
        knownMove: detail.known_move?.name ?? null,
        knownMoveType: detail.known_move_type?.name ?? null,
        minHappiness: detail.min_happiness ?? null,
        minBeauty: detail.min_beauty ?? null,
        minAffection: detail.min_affection ?? null,
        timeOfDay: detail.time_of_day ?? null,
        location: detail.location?.name ?? null,
        gender: detail.gender ?? null,
        needsOverworldRain: detail.needs_overworld_rain ?? false,
        turnUpsideDown: detail.turn_upside_down ?? false,
        relativePhysicalStats: detail.relative_physical_stats ?? null,
        partySpecies: detail.party_species?.name ?? null,
        partyType: detail.party_type?.name ?? null
    };
}

function getIdFromUrl(url) {
    if (!url) return null;
    const parts = url.split('/').filter(Boolean);
    const id = Number(parts[parts.length - 1]);
    return Number.isInteger(id) ? id : null;
}

export function clearDetails() {
    state.pokemon = null;
    state.species = null;
    state.evolution = null;
    state.loading = false;
    state.error = null;
}
