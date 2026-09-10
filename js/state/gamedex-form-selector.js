import { getDetailsState } from './details.js';
import './gamedex-capture-persistence.js';

let desiredShiny = false;
let releasingShinyClick = false;
let restoringShinyClick = false;

const detailContent = document.querySelector('#detail-content');
const ANIMATION_PREFERENCE_KEY = 'pokedex-gamedex-animated';

function syncHistoryState() {
    const state = window.history.state;
    if (state?.view !== 'pokemon') return;

    window.history.replaceState(
        { ...state, shiny: desiredShiny },
        '',
        window.location.href
    );
}

function animateSprite(image, keyframes, duration, easing = 'ease-out') {
    if (!image?.animate) return;

    image.style.transformStyle = 'preserve-3d';
    image.style.backfaceVisibility = 'hidden';
    image.animate(keyframes, {
        duration,
        easing,
        fill: 'both'
    });
}

function getSprite() {
    return detailContent?.querySelector('.gamedex-artwork img');
}

function getAnimationEnabled() {
    try {
        const stored = localStorage.getItem(ANIMATION_PREFERENCE_KEY);
        return stored === null ? true : stored === 'true';
    } catch {
        return true;
    }
}

function setAnimationEnabled(value) {
    try {
        localStorage.setItem(ANIMATION_PREFERENCE_KEY, String(value));
    } catch {
        // Ignore storage failures; the current session still works.
    }
}

function getAnimatedImage(pokemon, shiny) {
    const animated = pokemon?.sprites?.versions?.['generation-v']?.['black-white']?.animated;
    return shiny ? animated?.front_shiny ?? '' : animated?.front_default ?? '';
}

function getStaticImage(pokemon, shiny) {
    if (shiny) {
        return pokemon?.sprites?.front_shiny
            || pokemon?.sprites?.other?.['official-artwork']?.front_shiny
            || '';
    }

    return pokemon?.sprites?.other?.['official-artwork']?.front_default
        || pokemon?.sprites?.front_default
        || '';
}

function applySpriteState({ shiny, animated }) {
    const sprite = getSprite();
    const pokemon = getDetailsState().pokemon;
    if (!sprite || !pokemon) return false;

    const animatedImage = getAnimatedImage(pokemon, shiny);
    const staticImage = getStaticImage(pokemon, shiny);
    const useAnimated = animated && Boolean(animatedImage);
    const nextImage = useAnimated ? animatedImage : staticImage;
    if (!nextImage) return false;

    sprite.src = nextImage;
    sprite.classList.toggle('is-shiny', shiny);
    sprite.classList.toggle('is-animated', useAnimated);

    return useAnimated;
}

function syncMediaButtons() {
    const animationButton = detailContent?.querySelector('[data-gamedex-animation]');
    const shinyButton = detailContent?.querySelector('[data-gamedex-shiny]');
    const pokemon = getDetailsState().pokemon;
    if (!pokemon) return;

    const shiny = shinyButton?.getAttribute('aria-pressed') === 'true';
    const animationEnabled = getAnimationEnabled();
    const animatedAvailable = Boolean(getAnimatedImage(pokemon, shiny));

    if (animationButton) {
        animationButton.setAttribute('aria-pressed', String(animationEnabled && animatedAvailable));
        animationButton.textContent = animationEnabled && animatedAvailable ? 'GIF' : 'IMG';
        animationButton.title = animationEnabled && animatedAvailable
            ? 'Mostrar imagen estática'
            : 'Mostrar sprite animado';
    }
}

function restoreDesiredShiny() {
    if (!desiredShiny) return;

    const shinyButton = detailContent?.querySelector('[data-gamedex-shiny]');
    if (!shinyButton || shinyButton.getAttribute('aria-pressed') === 'true') return;

    restoringShinyClick = true;
    shinyButton.click();
    restoringShinyClick = false;
}

document.addEventListener('pokemon:open-detail', () => {
    desiredShiny = Boolean(window.history.state?.shiny);
});

window.addEventListener('popstate', (event) => {
    desiredShiny = Boolean(event.state?.shiny);
});

document.addEventListener('click', (event) => {
    const animationButton = event.target.closest('[data-gamedex-animation]');
    if (!animationButton || !detailContent?.contains(animationButton)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const nextAnimated = animationButton.getAttribute('aria-pressed') !== 'true';
    setAnimationEnabled(nextAnimated);

    const shiny = detailContent.querySelector('[data-gamedex-shiny]')?.getAttribute('aria-pressed') === 'true';
    applySpriteState({ shiny, animated: nextAnimated });
    syncMediaButtons();
}, true);

document.addEventListener('click', (event) => {
    const shinyButton = event.target.closest('[data-gamedex-shiny]');
    if (!shinyButton || releasingShinyClick || restoringShinyClick) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const nextShiny = shinyButton.getAttribute('aria-pressed') !== 'true';
    desiredShiny = nextShiny;
    syncHistoryState();

    const currentSprite = getSprite();

    if (nextShiny) {
        animateSprite(currentSprite, [
            { opacity: 1, transform: 'perspective(900px) rotateY(0deg) scale(1)' },
            { opacity: 1, transform: 'perspective(900px) rotateY(82deg) scale(.96)' },
            { opacity: 0, transform: 'perspective(900px) rotateY(90deg) scale(.94)' }
        ], 220, 'cubic-bezier(.62,.08,.42,.92)');

        window.setTimeout(() => {
            if (!document.contains(shinyButton)) return;
            applySpriteState({ shiny: true, animated: getAnimationEnabled() });
            shinyButton.setAttribute('aria-pressed', 'true');
            shinyButton.textContent = 'NORMAL';
            shinyButton.title = 'Cambiar entre normal y shiny';

            requestAnimationFrame(() => {
                animateSprite(getSprite(), [
                    { opacity: 0, transform: 'perspective(900px) rotateY(-90deg) scale(.94)' },
                    { opacity: 1, transform: 'perspective(900px) rotateY(-18deg) scale(1.02)', offset: .62 },
                    { opacity: 1, transform: 'perspective(900px) rotateY(0deg) scale(1)' }
                ], 320, 'cubic-bezier(.16,.82,.25,1)');
                syncMediaButtons();
            });
        }, 205);
    } else {
        animateSprite(currentSprite, [
            { opacity: 1, transform: 'perspective(900px) rotateY(0deg) scale(1)' },
            { opacity: .35, transform: 'perspective(900px) rotateY(48deg) scale(.98)' },
            { opacity: 0, transform: 'perspective(900px) rotateY(90deg) scale(.97)' }
        ], 150, 'cubic-bezier(.55,.05,.45,.95)');

        window.setTimeout(() => {
            if (!document.contains(shinyButton)) return;
            applySpriteState({ shiny: false, animated: getAnimationEnabled() });
            shinyButton.setAttribute('aria-pressed', 'false');
            shinyButton.textContent = 'SHINY';
            shinyButton.title = 'Cambiar entre normal y shiny';

            requestAnimationFrame(() => {
                animateSprite(getSprite(), [
                    { opacity: 0, transform: 'perspective(900px) rotateY(-55deg) scale(.97)' },
                    { opacity: 1, transform: 'perspective(900px) rotateY(0deg) scale(1)' }
                ], 190, 'cubic-bezier(.2,.75,.25,1)');
                syncMediaButtons();
            });
        }, 135);
    }
}, true);

document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-gamedex-form]');
    if (!select) return;

    queueMicrotask(syncHistoryState);

    const chip = document.querySelector(
        `[data-gamedex-form-chip="${CSS.escape(select.value)}"]`
    );

    chip?.click();
});

document.addEventListener('click', (event) => {
    const formChip = event.target.closest('[data-gamedex-form-chip]');
    if (!formChip) return;
    queueMicrotask(syncHistoryState);
});

const observer = new MutationObserver(() => {
    window.requestAnimationFrame(() => {
        restoreDesiredShiny();
        syncMediaButtons();
    });
});

if (detailContent) {
    observer.observe(detailContent, { childList: true, subtree: true });
}
