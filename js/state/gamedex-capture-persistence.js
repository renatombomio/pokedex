import { getDetailsState } from './details.js';
import { isPokemonCaptured } from './captured.js';

const detailContent = document.querySelector('#detail-content');

if (detailContent) {
    const observer = new MutationObserver(() => {
        window.requestAnimationFrame(syncCapturedState);
    });

    observer.observe(detailContent, { childList: true, subtree: true });
    document.addEventListener('captured:changed', syncCapturedState);
    window.requestAnimationFrame(syncCapturedState);
}

function syncCapturedState() {
    const card = detailContent?.querySelector('.gamedex-card');
    const artwork = card?.querySelector('.gamedex-artwork');
    const image = artwork?.querySelector('img');
    const pokemon = getDetailsState().pokemon;

    if (!artwork || !image || !pokemon) return;

    // Capture status is persistent logically, but the in-artwork Poké Ball is
    // intentionally transient. A reopened detail card must show the Pokémon normally.
    const captured = isPokemonCaptured(pokemon.id);
    artwork.classList.remove('is-capture-persisted');

    if (!captured) return;

    image.style.opacity = '';
    image.style.visibility = '';
    image.style.pointerEvents = '';
}
