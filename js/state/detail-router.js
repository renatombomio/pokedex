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

    if (!Number.isInteger(id)) {
        return;
    }

    await openPokemonDetail(
        form || id,
        event.detail?.fromHistory === true,
        form
    );
});

document.addEventListener('pokemon:open-form', async (event) => {
    const form = event.detail?.form;
    if (!form) return;

    await openPokemonDetail(form, false, form);
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

    openPokemonDetail(id);
});

async function openPokemonDetail(identifier, fromHistory = false, form = null) {
    const requestId = ++activeRequestId;

    try {
        const details = await loadPokemonDetails(identifier);

        if (requestId !== activeRequestId) {
            return;
        }

        setDetailView(details.pokemon.id, {
            pushHistory: !fromHistory,
            form
        });

        renderPokemonDetails(details);
    } catch (error) {
        console.error(
            'Could not load Pokémon details:',
            error
        );
    }
}
