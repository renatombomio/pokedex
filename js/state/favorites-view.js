import {
    getPokemon
} from '../api/pokemon.js';

import {
    getFavorites,
    isFavorite,
    toggleFavorite
} from './favorites.js';


const elements = {
    section: document.querySelector('#favorites'),
    content: document.querySelector('#favorites-content'),
    count: document.querySelector('#favorites-count')
};


const pokemonCache = new Map();
let renderRequestId = 0;


export function initializeFavoritesView() {
    if (!elements.section || !elements.content) {
        return;
    }

    decorateFavoriteControls(document.querySelector('#pokemon-grid'));
    decorateFavoriteControls(document.querySelector('#detail-content'));

    observeContainer('#pokemon-grid');
    observeContainer('#detail-content');
    observeContainer('#favorites-content');

    document.addEventListener('click', handleFavoriteClick);
    document.addEventListener('favorites:changed', handleFavoritesChanged);

    elements.content.addEventListener('click', (event) => {
        const card = event.target.closest('.pokemon-card');

        if (!card || event.target.closest('.favorite-toggle')) {
            return;
        }

        const id = Number(card.dataset.pokemonId);

        if (Number.isInteger(id)) {
            document.dispatchEvent(
                new CustomEvent('pokemon:open-detail', {
                    detail: { id }
                })
            );
        }
    });

    updateFavoriteCount();
}


export async function renderFavoritesView() {
    if (!elements.content) {
        return;
    }

    const requestId = ++renderRequestId;
    const favoriteIds = getFavorites();

    updateFavoriteCount(favoriteIds.length);
    setFavoritesLoading();

    if (favoriteIds.length === 0) {
        renderEmptyState();
        return;
    }

    const results = await Promise.allSettled(
        favoriteIds.map(loadFavoritePokemon)
    );

    if (requestId !== renderRequestId) {
        return;
    }

    const pokemon = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter((entry) => isFavorite(entry.id));

    const failedCount = results
        .filter((result) => result.status === 'rejected')
        .length;

    renderFavorites(pokemon, failedCount);
}


function handleFavoriteClick(event) {
    const button = event.target.closest('.favorite-toggle');

    if (!button) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const id = Number(button.dataset.pokemonId);

    if (!Number.isInteger(id)) {
        return;
    }

    toggleFavorite(id);
    syncFavoriteButtons(id);
    updateFavoriteCount();

    document.dispatchEvent(
        new CustomEvent('favorites:changed', {
            detail: {
                ids: getFavorites(),
                changedId: id
            }
        })
    );
}


function handleFavoritesChanged() {
    updateFavoriteCount();

    if (elements.section && !elements.section.classList.contains('hidden')) {
        renderFavoritesView();
    }
}


async function loadFavoritePokemon(id) {
    if (pokemonCache.has(id)) {
        return pokemonCache.get(id);
    }

    const pokemon = await getPokemon(id);
    pokemonCache.set(id, pokemon);
    return pokemon;
}


function renderFavorites(pokemon, failedCount) {
    if (pokemon.length === 0) {
        renderEmptyState(
            failedCount > 0
                ? 'No pudimos cargar tus favoritos. Inténtalo de nuevo.'
                : undefined
        );
        return;
    }

    const fragment = document.createDocumentFragment();

    pokemon.forEach((entry) => {
        fragment.appendChild(createFavoriteCard(entry));
    });

    elements.content.replaceChildren(fragment);
    decorateFavoriteControls(elements.content);

    if (failedCount > 0) {
        const notice = document.createElement('p');
        notice.className = 'favorites-notice';
        notice.textContent = `${failedCount} favorito${failedCount === 1 ? '' : 's'} no pudo${failedCount === 1 ? '' : 'ieron'} cargarse.`;
        elements.content.appendChild(notice);
    }
}


function createFavoriteCard(pokemon) {
    const article = document.createElement('article');
    article.className = 'pokemon-card';
    article.dataset.pokemonId = pokemon.id;

    const types = pokemon.types
        .map(({ type }) => `
            <span class="pokemon-type type-${type.name}">
                ${translateType(type.name)}
            </span>
        `)
        .join('');

    article.innerHTML = `
        <button
            class="pokemon-card-button"
            type="button"
            data-pokemon-id="${pokemon.id}"
            aria-label="Ver ${capitalize(pokemon.name)}"
        >
            <div class="pokemon-card-image">
                <span class="pokemon-number">#${formatId(pokemon.id)}</span>
                <img
                    src="${getPokemonImage(pokemon)}"
                    alt="${capitalize(pokemon.name)}"
                    loading="lazy"
                >
            </div>
            <div class="pokemon-card-content">
                <h3>${capitalize(pokemon.name)}</h3>
                <div class="pokemon-types">${types}</div>
            </div>
        </button>
    `;

    return article;
}


function decorateFavoriteControls(root) {
    if (!root) {
        return;
    }

    root.querySelectorAll('.pokemon-card, .gamedex-card').forEach((card) => {
        const id = getCardPokemonId(card);

        if (!id || card.querySelector('.favorite-toggle')) {
            return;
        }

        card.appendChild(createFavoriteButton(id));
    });
}


function observeContainer(selector) {
    const root = document.querySelector(selector);

    if (!root) {
        return;
    }

    const observer = new MutationObserver(() => {
        decorateFavoriteControls(root);
    });

    observer.observe(root, {
        childList: true,
        subtree: true
    });
}


function createFavoriteButton(id) {
    const button = document.createElement('button');
    const favorite = isFavorite(id);

    button.className = 'favorite-toggle';
    button.type = 'button';
    button.dataset.pokemonId = id;
    button.setAttribute('aria-pressed', String(favorite));
    button.setAttribute(
        'aria-label',
        favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'
    );
    button.title = favorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
    button.innerHTML = '<span aria-hidden="true">♥</span>';

    syncFavoriteButton(button, favorite);

    return button;
}


function syncFavoriteButtons(id) {
    const favorite = isFavorite(id);

    document
        .querySelectorAll(`.favorite-toggle[data-pokemon-id="${id}"]`)
        .forEach((button) => syncFavoriteButton(button, favorite));
}


function syncFavoriteButton(button, favorite) {
    button.classList.toggle('is-favorite', favorite);
    button.setAttribute('aria-pressed', String(favorite));
    button.setAttribute(
        'aria-label',
        favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'
    );
    button.title = favorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
}


function updateFavoriteCount(value = getFavorites().length) {
    if (elements.count) {
        elements.count.textContent = value;
    }

    document.querySelectorAll('[data-favorites-count]').forEach((element) => {
        element.textContent = value;
        element.hidden = value === 0;
    });
}


function setFavoritesLoading() {
    elements.content.innerHTML = `
        <div class="favorites-loading" aria-live="polite">
            <span>Cargando tu colección…</span>
        </div>
    `;
}


function renderEmptyState(message) {
    elements.content.innerHTML = `
        <div class="favorites-empty">
            <div class="favorites-empty-icon" aria-hidden="true">♥</div>
            <p class="favorites-empty-eyebrow">Tu colección</p>
            <h3>${message ? escapeHtml(message) : 'Todavía no tienes favoritos.'}</h3>
            <p>
                Guarda tus Pokémon favoritos desde la Pokédex
                para tenerlos siempre a mano.
            </p>
            <button class="favorites-explore" type="button" data-open-pokedex>
                Explorar Pokédex
            </button>
        </div>
    `;
}


function getCardPokemonId(card) {
    const datasetId = Number(card.dataset.pokemonId);

    if (Number.isInteger(datasetId)) {
        return datasetId;
    }

    const number = card.querySelector('.gamedex-number')?.textContent || '';
    const parsed = Number(number.replace(/[^0-9]/g, ''));

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}


function getPokemonImage(pokemon) {
    return (
        pokemon.sprites?.other?.['official-artwork']?.front_default ||
        pokemon.sprites?.front_default ||
        ''
    );
}


function translateType(type) {
    const translations = {
        normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
        grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
        ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
        rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
        steel: 'Acero', fairy: 'Hada'
    };

    return translations[type] ?? type;
}


function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}


function formatId(id) {
    return String(id).padStart(3, '0');
}


function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
