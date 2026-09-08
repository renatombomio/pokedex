import {
    renderFavoritesView
} from './favorites-view.js';


const elements = {
    hero: document.querySelector('.hero'),
    pokedex: document.querySelector('#pokedex'),
    detail: document.querySelector('#pokemon-detail'),
    favorites: document.querySelector('#favorites'),
    types: document.querySelector('#types')
};


let activeView = 'home';


export function initializeNavigation() {
    document.addEventListener('click', handleNavigationClick);
}


export function getActiveView() {
    return activeView;
}


export function showHome(target = 'pokedex') {
    activeView = 'home';

    elements.hero?.classList.remove('hidden');
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

    elements.hero?.classList.add('hidden');
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
