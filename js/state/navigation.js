import { renderFavoritesView } from './favorites-view.js';

const elements = {
    header: document.querySelector('.site-header'),
    hero: document.querySelector('.hero'),
    regions: document.querySelector('#regions'),
    types: document.querySelector('#types'),
    generations: document.querySelector('#generations'),
    pokedex: document.querySelector('#pokedex'),
    detail: document.querySelector('#pokemon-detail'),
    favorites: document.querySelector('#favorites'),
    navLinks: [...document.querySelectorAll('.main-nav a')]
};

let activeView = 'home';
let initialized = false;

export function initializeNavigation() {
    if (initialized) return;
    initialized = true;

    document.addEventListener('click', handleNavigationClick);
    document.addEventListener('change', handleNavigationChange);
    document.addEventListener('navigation:back-requested', handleBackRequest);
    document.addEventListener('region:open-detail', handleRegionOpenRequest);
    document.addEventListener('generation:open-detail', handleGenerationOpenRequest);
    window.addEventListener('popstate', handleHistoryChange);
    window.addEventListener('hashchange', handleHashChange);

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

    if (options.pushHistory !== false) pushRoute(target, null, options.context || null);

    requestAnimationFrame(() => {
        const targetElement = target === 'types' ? elements.types
            : target === 'regions' ? elements.regions
                : target === 'generations' ? elements.generations
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
    elements.types?.classList.add('hidden');
    elements.generations?.classList.add('hidden');
    elements.pokedex?.classList.add('hidden');
    elements.detail?.classList.add('hidden');
    elements.detail?.setAttribute('aria-hidden', 'true');
    elements.favorites?.classList.remove('hidden');
    getTypeDetailElement()?.classList.add('hidden');
    getRegionDetailElement()?.classList.add('hidden');
    getGenerationDetailElement()?.classList.add('hidden');
    if (options.pushHistory !== false) pushRoute('favorites');
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    await renderFavoritesView();
}

export function showTypeDetail(typeId, options = {}) {
    const typeDetail = getTypeDetailElement();
    if (!typeDetail || !typeId) return;
    activeView = 'type';
    setHeaderView('detail');
    setActiveNav('types');
    hideHomeViews();
    elements.detail?.classList.add('hidden');
    elements.favorites?.classList.add('hidden');
    getRegionDetailElement()?.classList.add('hidden');
    getGenerationDetailElement()?.classList.add('hidden');
    typeDetail.classList.remove('hidden');
    typeDetail.setAttribute('aria-hidden', 'false');
    if (options.pushHistory !== false) pushRoute(`type/${typeId}`, null, options.context || null);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

export async function showRegionDetailView(regionId, options = {}) {
    if (!regionId) return;
    activeView = 'region';
    setHeaderView('detail');
    setActiveNav('regions');
    hideHomeViews();
    elements.detail?.classList.add('hidden');
    elements.detail?.setAttribute('aria-hidden', 'true');
    elements.favorites?.classList.add('hidden');
    getTypeDetailElement()?.classList.add('hidden');
    getGenerationDetailElement()?.classList.add('hidden');
    const { initializeRegionDetail, showRegionDetail } = await import('./regions-detail.js');
    initializeRegionDetail();
    await showRegionDetail(regionId, options);
}

export async function showGenerationDetailView(generationId, options = {}) {
    if (!generationId) return;
    activeView = 'generation';
    setHeaderView('detail');
    setActiveNav('generations');
    hideHomeViews();
    elements.detail?.classList.add('hidden');
    elements.detail?.setAttribute('aria-hidden', 'true');
    elements.favorites?.classList.add('hidden');
    getTypeDetailElement()?.classList.add('hidden');
    getRegionDetailElement()?.classList.add('hidden');
    const { initializeGenerationDetail, showGenerationDetail } = await import('./generations-detail.js');
    initializeGenerationDetail();
    await showGenerationDetail(generationId, options);
}

export function setDetailView(id = null, options = {}) {
    activeView = 'detail';
    setHeaderView('detail');
    setActiveNav('pokedex');

    hideHomeViews();
    elements.pokedex?.classList.add('hidden');
    elements.favorites?.classList.add('hidden');
    elements.detail?.classList.remove('hidden');
    elements.detail?.setAttribute('aria-hidden', 'false');
    getTypeDetailElement()?.classList.add('hidden');
    getRegionDetailElement()?.classList.add('hidden');
    getGenerationDetailElement()?.classList.add('hidden');

    const context = options.context || null;
    const backButton = document.querySelector('#detail-back');
    if (backButton) {
        backButton.textContent = context?.label
            ? `← Volver a ${context.label}`
            : '← Volver a la Pokédex';
    }

    if (options.pushHistory !== false && Number.isInteger(id)) {
        pushRoute(`pokemon/${id}`, options.form ?? null, context);
    }
}

export function navigateBack() {
    const state = window.history.state;
    const view = state?.view;

    if (view === 'pokemon' && state.context) {
        window.history.back();
        return;
    }
    if (view === 'region') {
        if (state.context) {
            window.history.back();
            return;
        }
        showHome('regions', { pushHistory: false });
        window.history.replaceState({ view: 'regions' }, '', '#regions');
        return;
    }
    if (view === 'type') {
        if (state.context) {
            window.history.back();
            return;
        }
        showHome('types', { pushHistory: false });
        window.history.replaceState({ view: 'types' }, '', '#types');
        return;
    }
    if (view === 'generation') {
        if (state.context) {
            window.history.back();
            return;
        }
        showHome('generations', { pushHistory: false });
        window.history.replaceState({ view: 'generations' }, '', '#generations');
        return;
    }
    showHome('pokedex');
}

function handleBackRequest() {
    navigateBack();
}

function handleNavigationChange(event) {
    const select = event.target.closest('[data-gamedex-form]');
    if (!select) return;

    const form = select.value?.trim();
    const id = Number(window.history.state?.id);
    if (!form || !Number.isInteger(id)) return;

    setDetailView(id, { form, context: window.history.state?.context || null });
}

async function handleRegionOpenRequest(event) {
    const regionId = event.detail?.region;
    if (!regionId) return;
    await showRegionDetailView(regionId, {
        pushHistory: event.detail?.fromHistory !== true,
        context: event.detail?.context || null
    });
}

async function handleGenerationOpenRequest(event) {
    const generationId = Number(event.detail?.generation);
    if (!Number.isInteger(generationId)) return;
    await showGenerationDetailView(generationId, {
        pushHistory: event.detail?.fromHistory !== true,
        context: event.detail?.context || null
    });
}

function showHomeElements() {
    elements.hero?.classList.remove('hidden');
    elements.regions?.classList.remove('hidden');
    elements.types?.classList.remove('hidden');
    elements.generations?.classList.remove('hidden');
    elements.pokedex?.classList.remove('hidden');
    elements.detail?.classList.add('hidden');
    elements.detail?.setAttribute('aria-hidden', 'true');
    elements.favorites?.classList.add('hidden');
    getTypeDetailElement()?.classList.add('hidden');
    getRegionDetailElement()?.classList.add('hidden');
    getGenerationDetailElement()?.classList.add('hidden');
}

function hideHomeViews() {
    elements.hero?.classList.add('hidden');
    elements.regions?.classList.add('hidden');
    elements.types?.classList.add('hidden');
    elements.generations?.classList.add('hidden');
}

function pushRoute(route, form = null, context = null) {
    const url = route === 'pokedex'
        ? '#pokedex'
        : form
            ? `#${route}?form=${encodeURIComponent(form)}`
            : `#${route}`;

    window.history.pushState({
        view: route.split('/')[0],
        id: getRouteId(route),
        type: getRouteType(route),
        region: getRouteRegion(route),
        generation: getRouteGeneration(route),
        form: form || null,
        context: context || null
    }, '', url);
}

function handleHistoryChange(event) {
    restoreRoute(event.state?.view ? { state: event.state } : readRoute());
}

function handleHashChange() {
    restoreRoute(readRoute());
}

function restoreRoute(route) {
    const view = route.state?.view ?? 'home';
    if (view === 'pokemon' && Number.isInteger(route.state.id)) {
        requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('pokemon:open-detail', {
            detail: {
                id: route.state.id,
                form: route.state.form || null,
                context: route.state.context || null,
                fromHistory: true
            }
        })));
        return;
    }
    if (view === 'type' && route.state.type) {
        requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('type:open-detail', {
            detail: { type: route.state.type, fromHistory: true }
        })));
        return;
    }
    if (view === 'region' && route.state.region) {
        requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('region:open-detail', {
            detail: { region: route.state.region, fromHistory: true }
        })));
        return;
    }
    if (view === 'generation' && Number.isInteger(route.state.generation)) {
        requestAnimationFrame(() => document.dispatchEvent(new CustomEvent('generation:open-detail', {
            detail: { generation: route.state.generation, fromHistory: true }
        })));
        return;
    }
    if (view === 'favorites') {
        showFavorites({ pushHistory: false });
        return;
    }
    showHome(
        view === 'types' || view === 'regions' || view === 'generations' ? view : 'pokedex',
        { pushHistory: false, context: route.state?.context || null }
    );
}

function readRoute() {
    const hash = window.location.hash.replace(/^#/, '');
    const [route, query = ''] = hash.split('?');
    const params = new URLSearchParams(query);
    const form = params.get('form') || null;

    if (route === 'favorites') return { state: { view: 'favorites' }, url: '#favorites' };
    if (route === 'types') return { state: { view: 'types' }, url: '#types' };
    if (route === 'regions') return { state: { view: 'regions' }, url: '#regions' };
    if (route === 'generations') return { state: { view: 'generations' }, url: '#generations' };
    if (route.startsWith('type/')) {
        const type = route.split('/')[1]?.toLowerCase();
        if (type) return { state: { view: 'type', type }, url: `#type/${type}` };
    }
    if (route.startsWith('region/')) {
        const region = route.split('/')[1]?.toLowerCase();
        if (region) return { state: { view: 'region', region }, url: `#region/${region}` };
    }
    if (route.startsWith('generation/')) {
        const generation = Number(route.split('/')[1]);
        if (Number.isInteger(generation)) return { state: { view: 'generation', generation }, url: `#generation/${generation}` };
    }
    if (route.startsWith('pokemon/')) {
        const id = Number(route.split('/')[1]);
        if (Number.isInteger(id)) {
            return {
                state: { view: 'pokemon', id, form, context: null },
                url: form ? `#pokemon/${id}?form=${encodeURIComponent(form)}` : `#pokemon/${id}`
            };
        }
    }
    return { state: { view: 'pokedex' }, url: '#pokedex' };
}

function setHeaderView(view) {
    elements.header?.setAttribute('data-view', view);
}

function setActiveNav(target) {
    const navTarget = ['types', 'regions', 'generations', 'favorites'].includes(target) ? target : 'pokedex';
    elements.navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${navTarget}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
}

function handleNavigationClick(event) {
    const link = event.target.closest('.main-nav a');
    if (link) {
        const hash = link.getAttribute('href');
        if (hash === '#favorites') { event.preventDefault(); showFavorites(); return; }
        if (hash === '#types' || hash === '#regions' || hash === '#generations' || hash === '#pokedex') {
            event.preventDefault();
            showHome(hash.slice(1));
            return;
        }
    }
    if (event.target.closest('[data-open-pokedex]')) {
        event.preventDefault();
        showHome('pokedex');
    }
}

function getRouteId(route) {
    const id = Number(route.split('/')[1]);
    return Number.isInteger(id) ? id : null;
}

function getRouteType(route) {
    return route.startsWith('type/') ? route.split('/')[1] : null;
}

function getRouteRegion(route) {
    return route.startsWith('region/') ? route.split('/')[1] : null;
}

function getRouteGeneration(route) {
    if (!route.startsWith('generation/')) return null;
    const id = Number(route.split('/')[1]);
    return Number.isInteger(id) ? id : null;
}

function getTypeDetailElement() {
    return document.querySelector('#type-detail');
}

function getRegionDetailElement() {
    return document.querySelector('#region-detail');
}

function getGenerationDetailElement() {
    return document.querySelector('#generation-detail');
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
