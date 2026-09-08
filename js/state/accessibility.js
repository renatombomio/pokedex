const grid = document.querySelector('#pokemon-grid');
const detailSection = document.querySelector('#pokemon-detail');
const detailContent = document.querySelector('#detail-content');
const detailBack = document.querySelector('#detail-back');
const menuButton = document.querySelector('.menu-toggle');

let lastFocusedElement = null;
let modalTrigger = null;

// Navigate the Pokémon grid by visual row and column while preserving Tab navigation.
grid?.addEventListener('keydown', (event) => {
    const buttons = [...grid.querySelectorAll('.pokemon-card-button')];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;

    let columns = 1;
    const gridColumns = window.getComputedStyle(grid).gridTemplateColumns;
    if (gridColumns && gridColumns !== 'none') {
        columns = Math.max(1, gridColumns.split(' ').length);
    }

    let next = null;

    if (event.key === 'ArrowRight') next = Math.min(index + 1, buttons.length - 1);
    if (event.key === 'ArrowLeft') next = Math.max(index - 1, 0);
    if (event.key === 'ArrowDown') next = Math.min(index + columns, buttons.length - 1);
    if (event.key === 'ArrowUp') next = Math.max(index - columns, 0);
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;

    if (next === null || next === index) return;

    event.preventDefault();
    buttons[next]?.focus();
});

// Remember the control that opened Gamedex.
document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.pokemon-card-button, .evolution-card-button, .search-result-button');
    if (trigger && !trigger.closest('#detail-content')) lastFocusedElement = trigger;
});

// Move focus to the Gamedex title after dynamic content is rendered.
const observer = new MutationObserver(() => {
    if (!detailContent || detailSection?.classList.contains('hidden')) return;
    const heading = detailContent.querySelector('h1');
    if (!heading || heading.dataset.a11yFocused === 'true') return;
    heading.dataset.a11yFocused = 'true';
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
});
if (detailContent) observer.observe(detailContent, { childList: true, subtree: true });

// Restore focus when returning from Gamedex.
detailBack?.addEventListener('click', () => {
    window.setTimeout(() => {
        if (lastFocusedElement && document.contains(lastFocusedElement)) lastFocusedElement.focus();
    }, 0);
});

// Reflect the mobile menu state in its accessible name.
menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});

// Keep type filter state exposed to assistive technology.
document.querySelector('#types')?.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-button');
    if (!button) return;
    document.querySelectorAll('.filter-button').forEach((item) => {
        item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
    });
});

// Keep keyboard focus inside the search dialog while it is open.
document.addEventListener('click', (event) => {
    const trigger = event.target.closest('#search-form button[type="submit"]');
    if (!trigger) return;
    modalTrigger = trigger;
});

document.addEventListener('keydown', (event) => {
    const modal = document.querySelector('.search-modal.is-open');
    if (!modal || event.key !== 'Tab') return;

    const focusable = [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.disabled && element.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

// Move focus into the dialog when search results open and return it to the search trigger on close.
const searchModalObserver = new MutationObserver(() => {
    const modal = document.querySelector('.search-modal');
    if (!modal) return;

    const isOpen = modal.classList.contains('is-open');
    const wasOpen = modal.dataset.a11yOpen === 'true';

    if (isOpen && !wasOpen) {
        modal.dataset.a11yOpen = 'true';
        requestAnimationFrame(() => {
            modal.querySelector('.search-modal-close')?.focus();
        });
    }

    if (!isOpen && wasOpen) {
        modal.dataset.a11yOpen = 'false';
        requestAnimationFrame(() => {
            if (modalTrigger && document.contains(modalTrigger)) modalTrigger.focus();
        });
    }
});

if (document.body) {
    searchModalObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'aria-hidden']
    });
}
