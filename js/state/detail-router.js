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

    if (!Number.isInteger(id)) {
        return;
    }

    await openPokemonDetail(id);
});


/* ========================================
   EVOLUTION CHAIN → DETAIL
======================================== */

/*
 * Evolution cards are rendered dynamically inside the detail view,
 * so delegation keeps this integration independent from ui.js.
 */
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


async function openPokemonDetail(id) {
    const requestId = ++activeRequestId;

    try {
        const details = await loadPokemonDetails(id);

        if (requestId !== activeRequestId) {
            return;
        }

        setDetailView();
        renderPokemonDetails(details);
    } catch (error) {
        console.error(
            'Could not load Pokémon details:',
            error
        );
    }
}
