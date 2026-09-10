import { getDetailsState } from './details.js';
import { isPokemonCaptured } from './captured.js';

const detailContent = document.querySelector('#detail-content');
const STYLE_ID = 'gamedex-capture-persistence-style';

if (detailContent) {
    installStyles();

    const observer = new MutationObserver(() => {
        window.requestAnimationFrame(syncCapturedVisual);
    });

    observer.observe(detailContent, { childList: true, subtree: true });
    document.addEventListener('captured:changed', syncCapturedVisual);
    window.requestAnimationFrame(syncCapturedVisual);
}

function installStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        .gamedex-artwork.is-capture-persisted img {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            animation: none !important;
        }
        .gamedex-artwork.is-capture-persisted .gamedex-capture-ball {
            opacity: 1 !important;
            visibility: visible !important;
            animation: none !important;
            transform: translate(var(--capture-target-x), var(--capture-target-y)) scale(.9) !important;
        }
        .gamedex-artwork.is-capture-persisted .gamedex-capture-stars {
            opacity: 0;
        }
    `;
    document.head.append(style);
}

function syncCapturedVisual() {
    const card = detailContent?.querySelector('.gamedex-card');
    const artwork = card?.querySelector('.gamedex-artwork');
    const image = artwork?.querySelector('img');
    const ball = artwork?.querySelector('.gamedex-capture-ball');
    const pokemon = getDetailsState().pokemon;

    if (!artwork || !image || !ball || !pokemon) return;

    const captured = isPokemonCaptured(pokemon.id);
    artwork.classList.toggle('is-capture-persisted', captured);

    if (!captured) {
        image.style.opacity = '';
        image.style.visibility = '';
        image.style.pointerEvents = '';
        image.classList.remove('is-capture-target', 'is-capture-absorbing', 'is-capture-escape');
        ball.classList.remove('is-success', 'is-failed', 'is-at-target', 'is-opening', 'is-absorbing');
        ball.style.transform = '';
        return;
    }

    const artworkRect = artwork.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const targetX = imageRect.left + imageRect.width / 2 - artworkRect.left;
    const targetY = imageRect.top + imageRect.height / 2 - artworkRect.top;

    artwork.style.setProperty('--capture-target-x', `${targetX}px`);
    artwork.style.setProperty('--capture-target-y', `${targetY}px`);
    image.style.opacity = '0';
    image.style.visibility = 'hidden';
    image.style.pointerEvents = 'none';
    ball.style.transform = `translate(${targetX}px, ${targetY}px) scale(.9)`;
    ball.classList.remove('is-failed', 'is-shaking', 'is-opening', 'is-absorbing');
    ball.classList.add('is-success');
}
