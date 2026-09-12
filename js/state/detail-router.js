import {
    loadPokemonDetails
} from './details.js';

import {
    renderPokemonDetails
} from './ui.js';

import {
    setDetailView
} from './navigation.js';

import {
    getRegionById
} from './regions.js';

let activeRequestId = 0;

document.addEventListener('pokemon:open-detail', async (event) => {
    const id = Number(event.detail?.id);
    const form = event.detail?.form || null;
    const context = getPokemonNavigationContext(event.detail?.context);

    if (!Number.isInteger(id)) {
        return;
    }

    await openPokemonDetail(
        form || id,
        event.detail?.fromHistory === true,
        form,
        context
    );
});

document.addEventListener('pokemon:open-form', async (event) => {
    const form = event.detail?.form;
    if (!form) return;

    await openPokemonDetail(
        form,
        false,
        form,
        getPokemonNavigationContext()
    );
});

/* ========================================
   EVOLUTION CHAIN → DETAIL
======================================== */

document.addEventListener('click', (event) => {
    const button = event.target.closest('.evolution-card-button');

    if (!button) {
        return;
    }

    event.preventDefault();

    const id = Number(button.dataset.evolutionPokemonId);

    if (!Number.isInteger(id)) {
        return;
    }

    openPokemonDetail(
        id,
        false,
        null,
        getPokemonNavigationContext()
    );
});

function getPokemonNavigationContext(explicitContext = null) {
    if (explicitContext) {
        return explicitContext;
    }

    const state = window.history.state;
    if (state?.context) {
        return state.context;
    }

    if (state?.view === 'region' && state.region) {
        const region = getRegionById(state.region);
        if (region) {
            return {
                view: 'region',
                id: region.id,
                label: region.name
            };
        }
    }

    return null;
}

async function openPokemonDetail(identifier, fromHistory = false, form = null, context = null) {
    const requestId = ++activeRequestId;

    try {
        const details = await loadPokemonDetails(identifier);

        if (requestId !== activeRequestId) {
            return;
        }

        setDetailView(details.pokemon.id, {
            pushHistory: !fromHistory,
            form,
            context
        });

        renderPokemonDetails(details);
    } catch (error) {
        console.error(
            'Could not load Pokémon details:',
            error
        );
    }
}
