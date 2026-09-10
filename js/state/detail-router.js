import {
    loadPokemonDetails
} from './details.js';

import {
    renderPokemonDetails
} from './ui.js';

import {
    setDetailView
} from './navigation.js';

let activeRequestId = 0;

document.addEventListener('pokemon:open-detail', async (event) => {
    const id = Number(event.detail?.id);
    const form = event.detail?.form || null;
    const context = event.detail?.context || window.history.state?.context || null;

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

    await openPokemonDetail(form, false, form, window.history.state?.context || null);
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

    const id = Number(button.dataset.pokemonId);

    if (!Number.isInteger(id)) {
        return;
    }

    openPokemonDetail(id, false, null, window.history.state?.context || null);
});

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
