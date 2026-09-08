import {
    loadPokemonDetails
} from './details.js';

import {
    renderPokemonDetails
} from './ui.js';


let activeRequestId = 0;


document.addEventListener('pokemon:open-detail', async (event) => {
    const id = Number(event.detail?.id);

    if (!Number.isInteger(id)) {
        return;
    }

    const requestId = ++activeRequestId;

    try {
        const details = await loadPokemonDetails(id);

        if (requestId !== activeRequestId) {
            return;
        }

        renderPokemonDetails(details);
    } catch (error) {
        console.error(
            'Could not load Pokémon details:',
            error
        );
    }
});
