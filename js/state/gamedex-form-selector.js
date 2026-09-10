let desiredShiny = false;
let releasingShinyClick = false;
let restoringShinyClick = false;
let transitionTimer = null;

const detailContent = document.querySelector('#detail-content');

function syncHistoryState() {
    const state = window.history.state;
    if (state?.view !== 'pokemon') return;

    window.history.replaceState(
        { ...state, shiny: desiredShiny },
        '',
        window.location.href
    );
}

function setTransition(className, duration) {
    if (!detailContent) return;

    window.clearTimeout(transitionTimer);
    detailContent.classList.remove(
        'is-shiny-transition-out',
        'is-shiny-transition-in',
        'is-normal-transition'
    );
    void detailContent.offsetWidth;
    detailContent.classList.add(className);
    transitionTimer = window.setTimeout(() => {
        detailContent.classList.remove(className);
    }, duration);
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

    if (nextShiny) {
        setTransition('is-shiny-transition-out', 300);
        window.setTimeout(() => {
            if (!document.contains(shinyButton)) return;
            releasingShinyClick = true;
            shinyButton.click();
            releasingShinyClick = false;
            requestAnimationFrame(() => setTransition('is-shiny-transition-in', 430));
        }, 290);
    } else {
        setTransition('is-normal-transition', 240);
        window.setTimeout(() => {
            if (!document.contains(shinyButton)) return;
            releasingShinyClick = true;
            shinyButton.click();
            releasingShinyClick = false;
        }, 120);
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
    window.requestAnimationFrame(restoreDesiredShiny);
});

if (detailContent) {
    observer.observe(detailContent, { childList: true, subtree: true });
}
