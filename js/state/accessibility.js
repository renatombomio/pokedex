const grid = document.querySelector('#pokemon-grid');
const detailSection = document.querySelector('#pokemon-detail');
const detailContent = document.querySelector('#detail-content');
const detailBack = document.querySelector('#detail-back');
const menuButton = document.querySelector('.menu-toggle');

let lastFocusedElement = null;
let modalTrigger = null;

grid?.addEventListener('keydown', (event) => {
    const buttons = [...grid.querySelectorAll('.pokemon-card-button')];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;

    let columns = 1;
    const gridColumns = window.getComputedStyle(grid).gridTemplateColumns;
    if (gridColumns && gridColumns !== 'none') columns = Math.max(1, gridColumns.split(' ').length);

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

document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.pokemon-card-button, .evolution-card-button, .search-result-button');
    if (trigger && !trigger.closest('#detail-content')) lastFocusedElement = trigger;
});

// Gamedex replaces #detail-content in one operation, so observe only direct child changes.
const observer = new MutationObserver(() => {
    if (!detailContent || detailSection?.classList.contains('hidden')) return;
    const heading = detailContent.querySelector('h1');
    if (!heading || heading.dataset.a11yFocused === 'true') return;
    heading.dataset.a11yFocused = 'true';
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
});
if (detailContent) observer.observe(detailContent, { childList: true });

detailBack?.addEventListener('click', () => {
    window.setTimeout(() => {
        if (lastFocusedElement && document.contains(lastFocusedElement)) lastFocusedElement.focus();
    }, 0);
});

menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});

document.querySelector('#types')?.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-button');
    if (!button) return;
    document.querySelectorAll('.filter-button').forEach((item) => {
        item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
    });
});

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

// The search modal is created by main.js before this module executes, so observe the modal itself.
const searchModal = document.querySelector('.search-modal');

if (searchModal) {
    const searchModalObserver = new MutationObserver(() => {
        const isOpen = searchModal.classList.contains('is-open');
        const wasOpen = searchModal.dataset.a11yOpen === 'true';
        if (isOpen && !wasOpen) {
            searchModal.dataset.a11yOpen = 'true';
            window.setTimeout(() => searchModal.querySelector('.search-modal-close')?.focus(), 0);
        }
        if (!isOpen && wasOpen) {
            searchModal.dataset.a11yOpen = 'false';
        }
    });

    searchModalObserver.observe(searchModal, {
        attributes: true,
        attributeFilter: ['class']
    });
}

// Restore focus after the search dialog closes.
document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-modal-close')) return;
    window.setTimeout(() => {
        if (modalTrigger && document.contains(modalTrigger)) modalTrigger.focus();
    }, 0);
});

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !document.querySelector('.search-modal.is-open')) return;
    window.setTimeout(() => {
        if (modalTrigger && document.contains(modalTrigger)) modalTrigger.focus();
    }, 0);
});
