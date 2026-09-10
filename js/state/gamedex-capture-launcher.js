import { getDetailsState } from './details.js';
import { isPokemonCaptured } from './gamedex-capture.js';

const detailContent = document.querySelector('#detail-content');

if (detailContent) {
    const observer = new MutationObserver(() => {
        window.requestAnimationFrame(ensureCaptureLauncher);
    });

    observer.observe(detailContent, { childList: true, subtree: true });
    window.requestAnimationFrame(ensureCaptureLauncher);
}

function ensureCaptureLauncher() {
    const card = detailContent?.querySelector('.gamedex-card');
    const meta = card?.querySelector('.gamedex-meta');
    const pokemon = getDetailsState().pokemon;

    if (!card || !meta || !pokemon) return;

    let button = meta.querySelector('.gamedex-capture-launch');

    if (!button) {
        button = document.createElement('button');
        button.className = 'gamedex-capture-launch';
        button.type = 'button';
        button.innerHTML = '<span class="gamedex-capture-launch-ball" aria-hidden="true"></span>';
        meta.append(button);
    }

    const captured = isPokemonCaptured(pokemon.id);
    button.classList.toggle('is-captured', captured);
    button.disabled = captured;
    button.setAttribute('aria-pressed', String(captured));
    button.setAttribute(
        'aria-label',
        captured ? `${pokemon.name} capturado` : `Capturar ${pokemon.name}`
    );
    button.title = captured ? 'Pokémon capturado' : 'Capturar Pokémon';
}
