import { getContextBreadcrumbItems, mountWorldBreadcrumb } from './world-navigation.js';

const detail = document.querySelector('#pokemon-detail');

if (detail) {
    const observer = new MutationObserver(() => renderPokemonBreadcrumbs());
    observer.observe(detail, { childList: true, subtree: true });
    window.addEventListener('popstate', renderPokemonBreadcrumbs);
    renderPokemonBreadcrumbs();
}

function renderPokemonBreadcrumbs() {
    if (detail?.classList.contains('hidden')) return;

    const container = detail.querySelector('.container');
    if (!container) return;

    const state = window.history.state;
    if (state?.view !== 'pokemon') return;

    const id = Number(state.id);
    const heading = detail.querySelector('.gamedex-card h1, .gamedex-card h2, [data-pokemon-name]');
    const pokemonLabel = heading?.textContent?.trim()
        || (Number.isInteger(id) ? `Pokémon #${String(id).padStart(3, '0')}` : 'Pokémon');

    const items = getContextBreadcrumbItems({ ...state, pokemonLabel });
    const current = container.querySelector('.world-breadcrumbs');
    const signature = items.map((item) => item.label).join('|');

    if (current?.dataset.signature === signature) return;

    const breadcrumbs = mountWorldBreadcrumb(container, items);
    breadcrumbs.dataset.signature = signature;
}
