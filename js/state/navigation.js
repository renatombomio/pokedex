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


export function initializeNavigation() {
    document.addEventListener('click', handleNavigationClick);
    setHeaderView('home');
    setActiveNav('pokedex');
}


export function getActiveView() {
    return activeView;
}


export function showHome(target = 'pokedex') {
    activeView = 'home';
    setHeaderView('home');
    setActiveNav(target === 'types' ? 'types' : target === 'regions' ? 'regions' : 'pokedex');

    elements.hero?.classList.remove('hidden');
    elements.regions?.classList.remove('hidden');
    elements.pokedex?.classList.remove('hidden');
    elements.detail?.classList.add('hidden');
    elements.detail?.setAttribute('aria-hidden', 'true');
    elements.favorites?.classList.add('hidden');

    if (target === 'types') {
        requestAnimationFrame(() => {
            elements.types?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
        return;
    }

    if (target === 'regions') {
        requestAnimationFrame(() => {
            elements.regions?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
        return;
    }

    if (target === 'pokedex') {
        requestAnimationFrame(() => {
            elements.pokedex?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
}


export async function showFavorites() {
    activeView = 'favorites';
    setHeaderView('favorites');
    setActiveNav('favorites');

    elements.hero?.classList.add('hidden');
    elements.regions?.classList.add('hidden');
    elements.pokedex?.classList.add('hidden');
    elements.detail?.classList.add('hidden');
    elements.detail?.setAttribute('aria-hidden', 'true');
    elements.favorites?.classList.remove('hidden');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    await renderFavoritesView();
}


export function setDetailView() {
    setHeaderView('detail');
    setActiveNav('pokedex');
}


function setHeaderView(view) {
    if (!elements.header) {
        return;
    }

    elements.header.dataset.view = view;
}


function setActiveNav(target) {
    elements.navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${target}`;

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
    }

    if (event.target.closest('#detail-back') && activeView === 'favorites') {
        requestAnimationFrame(() => {
            showFavorites();
        });
    }
}
