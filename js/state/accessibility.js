const grid = document.querySelector('#pokemon-grid');
const detailSection = document.querySelector('#pokemon-detail');
const detailContent = document.querySelector('#detail-content');
const detailBack = document.querySelector('#detail-back');
const menuButton = document.querySelector('.menu-toggle');

let lastFocusedElement = null;

// Arrow/Home/End navigation keeps normal Tab navigation intact.
grid?.addEventListener('keydown', (event) => {
    const buttons = [...grid.querySelectorAll('.pokemon-card-button')];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;

    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(index + 1, buttons.length - 1);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(index - 1, 0);
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
