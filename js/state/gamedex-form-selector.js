let desiredShiny = false;
let releasingShinyClick = false;
let restoringShinyClick = false;

const detailContent = document.querySelector('#detail-content');
const ANIMATION_PREFERENCE_KEY = 'pokedex-gamedex-animated';
const failedShinyGifUrls = new Set();

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

function getCurrentPokemonId() {
    const number = detailContent?.querySelector('.gamedex-number')?.textContent ?? '';
    const id = Number.parseInt(number.replace(/\D/g, ''), 10);
    return Number.isFinite(id) ? id : null;
}

function getShinyStaticImage(id) {
    return id
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}-shiny.png`
        : '';
}

function getShinyGifImage(id) {
    return id
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}-shiny.gif`
        : '';
}

function syncShinyAnimatedSprite() {
    const shinyButton = detailContent?.querySelector('[data-gamedex-shiny]');
    const sprite = getSprite();
    if (!shinyButton || !sprite || shinyButton.getAttribute('aria-pressed') !== 'true') return;
    if (localStorage.getItem(ANIMATION_PREFERENCE_KEY) === 'false') return;

    const id = getCurrentPokemonId();
    const gifUrl = getShinyGifImage(id);
    if (!gifUrl || failedShinyGifUrls.has(gifUrl)) return;

    const staticUrl = sprite.currentSrc || sprite.src || getShinyStaticImage(id);
    const probe = new Image();
    probe.onload = () => {
        if (!document.contains(sprite)) return;
        sprite.src = gifUrl;
        sprite.classList.add('is-animated');
    };
    probe.onerror = () => {
        failedShinyGifUrls.add(gifUrl);
        if (document.contains(sprite)) {
            sprite.src = staticUrl || getShinyStaticImage(id);
            sprite.classList.remove('is-animated');
        }
    };
    probe.src = gifUrl;
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
            releasingShinyClick = true;
            shinyButton.click();
            releasingShinyClick = false;

            requestAnimationFrame(() => {
                animateSprite(getSprite(), [
                    { opacity: 0, transform: 'perspective(900px) rotateY(-90deg) scale(.94)' },
                    { opacity: 1, transform: 'perspective(900px) rotateY(-18deg) scale(1.02)', offset: .62 },
                    { opacity: 1, transform: 'perspective(900px) rotateY(0deg) scale(1)' }
                ], 320, 'cubic-bezier(.16,.82,.25,1)');
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
            releasingShinyClick = true;
            shinyButton.click();
            releasingShinyClick = false;

            requestAnimationFrame(() => {
                animateSprite(getSprite(), [
                    { opacity: 0, transform: 'perspective(900px) rotateY(-55deg) scale(.97)' },
                    { opacity: 1, transform: 'perspective(900px) rotateY(0deg) scale(1)' }
                ], 190, 'cubic-bezier(.2,.75,.25,1)');
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
        syncShinyAnimatedSprite();
    });
});

if (detailContent) {
    observer.observe(detailContent, { childList: true, subtree: true });
}
