import {
    renderFavoritesView
} from './favorites-view.js';


const elements = {
    header: document.querySelector('.site-header'),
    hero: document.querySelector('.hero'),
    regions: document.querySelector('#regions'),
    pokedex: document.querySelector('#pokedex'),
    detail: document.querySelector('#pokemon-detail'),
    favorites: document.querySelector('#favorites'),
    types: document.querySelector('#types'),
    navLinks: [...document.querySelectorAll('.main-nav a')]
};


let activeView = 'home';
let initialized = false;


export function initializeNavigation() {
    if (initialized) return;
    initialized = true;

    document.addEventListener('click', handleNavigationClick);
    window.addEventListener('popstate', handleHistoryChange);

    const route = readRoute();
    window.history.replaceState(route.state, '', route.url);
    restoreRoute(route);
}


export function getActiveView() {
    return activeView;
}


export function showHome(target = 'pokedex', options = {}) {
    activeView = 'home';
    setHeaderView('home');
    setActiveNav(target);
    showHomeElements();

    if (options.pushHistory !== false) pushRoute(target);

    requestAnimationFrame(() => {
        const targetElement = target === 'types'
            ? elements.types
            : target === 'regions'
                ? elements.regions
                : elements.pokedex;

        targetElement?.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start'
        });
    });
}


export async function showFavorites(options = {}) {
    activeView = 'favorites';
    setHeaderView('favorites');
    setActiveNav('favorites');

    elements.hero?.classList.add('hidden');
    elements.regions?.classList.add('hidden');
    elements.pokedex?.classList.add('hidden');
    elements.detail?.classList.add('hidden');
    elements.detail?.setAttribute('aria-hidden', 'true');
    elements.favorites?.classList.remove('hidden');

    if (options.pushHistory !== false) pushRoute('favorites');

    window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });

    await renderFavoritesView();
}


export function setDetailView(id = null, options = {}) {
    activeView = 'detail';
    setHeaderView('detail');
    setActiveNav('pokedex');

    if (options.pushHistory !== false && Number.isInteger(id)) {
        pushRoute(`pokemon/${id}`);
    }
}


export function navigateBack() {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    showHome('pokedex');
}


function showHomeElements() {
    elements.hero?.classList.remove('hidden');
    elements.regions?.classList.remove('hidden');
    elements.pokedex?.classList.remove('hidden');
    elements.detail?.classList.add('hidden');
    elements.detail?.setAttribute('aria-hidden', 'true');
    elements.favorites?.classList.add('hidden');
}


function pushRoute(route) {
    const url = route === 'pokedex' ? '#pokedex' : `#${route}`;

    window.history.pushState(
        { view: route.split('/')[0], id: getRouteId(route) },
        '',
        url
    );
}


function handleHistoryChange(event) {
    restoreRoute(
        event.state?.view
            ? { state: event.state }
            : readRoute()
    );
}


function restoreRoute(route) {
    const view = route.state?.view ?? 'home';

    if (view === 'pokemon' && Number.isInteger(route.state.id)) {
        requestAnimationFrame(() => {
            document.dispatchEvent(new CustomEvent('pokemon:open-detail', {
                detail: {
                    id: route.state.id,
                    fromHistory: true
                }
            }));
        });
        return;
    }

    if (view === 'favorites') {
        showFavorites({ pushHistory: false });
        return;
    }

    showHome(
        view === 'types' || view === 'regions' ? view : 'pokedex',
        { pushHistory: false }
    );
}


function readRoute() {
    const hash = window.location.hash.replace(/^#/, '');

    if (hash === 'favorites') {
        return { state: { view: 'favorites' }, url: '#favorites' };
    }

    if (hash === 'types') {
        return { state: { view: 'types' }, url: '#types' };
    }

    if (hash === 'regions') {
        return { state: { view: 'regions' }, url: '#regions' };
    }

    if (hash.startsWith('pokemon/')) {
        const id = Number(hash.split('/')[1]);

        if (Number.isInteger(id)) {
            return {
                state: { view: 'pokemon', id },
                url: `#pokemon/${id}`
            };
        }
    }

    return { state: { view: 'pokedex' }, url: '#pokedex' };
}


function setHeaderView(view) {
    elements.header?.setAttribute('data-view', view);
}


function setActiveNav(target) {
    const navTarget = ['types', 'regions', 'favorites'].includes(target)
        ? target
        : 'pokedex';

    elements.navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${navTarget}`;

        link.classList.toggle('is-active', isActive);

        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}


function handleNavigationClick(event) {
    const link = event.target.closest('.main-nav a');

    if (link) {
        const hash = link.getAttribute('href');

        if (hash === '#favorites') {
            event.preventDefault();
            showFavorites();
            return;
        }

        if (hash === '#types') {
            event.preventDefault();
            showHome('types');
            return;
        }

        if (hash === '#regions') {
            event.preventDefault();
            showHome('regions');
            return;
        }

        if (hash === '#pokedex') {
            event.preventDefault();
            showHome('pokedex');
            return;
        }
    }

    if (event.target.closest('[data-open-pokedex]')) {
        event.preventDefault();
        showHome('pokedex');
        return;
    }

    if (event.target.closest('#detail-back')) {
        event.preventDefault();
        navigateBack();
    }
}


function getRouteId(route) {
    const id = Number(route.split('/')[1]);
    return Number.isInteger(id) ? id : null;
}


function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
