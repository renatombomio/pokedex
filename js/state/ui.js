import { renderGamedex } from './gamedex.js';

const elements = {
    grid: document.querySelector('#pokemon-grid'),
    count: document.querySelector('#pokemon-count'),
    loading: document.querySelector('#loading-state'),
    error: document.querySelector('#error-state'),
    empty: document.querySelector('#empty-state'),
    retry: document.querySelector('#retry-button')
};

function ensureEmptyStateStyles() {
    if (document.querySelector('link[data-empty-state-styles]')) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/empty-states.css';
    stylesheet.dataset.emptyStateStyles = 'true';
    document.head.appendChild(stylesheet);
}

ensureEmptyStateStyles();

export function renderPokemon(pokemon) {
    hideAllStates();
    elements.count.textContent = pokemon.length;

    if (pokemon.length === 0) {
        elements.grid.replaceChildren();
        elements.empty.classList.remove('hidden');
        return;
    }

    const existingCards = new Map(
        [...elements.grid.querySelectorAll('.pokemon-card')]
            .map((card) => [String(card.dataset.pokemonId), card])
    );

    const fragment = document.createDocumentFragment();

    pokemon.forEach((entry) => {
        const key = String(entry.id);
        fragment.appendChild(existingCards.get(key) ?? createPokemonCard(entry));
    });

    elements.grid.replaceChildren(fragment);
}

export function showLoading() {
    elements.grid.replaceChildren();
    hideAllStates();
    elements.loading.classList.remove('hidden');
}

export function showError() {
    elements.grid.replaceChildren();
    hideAllStates();
    elements.error.classList.remove('hidden');
}

export function getRetryButton() {
    return elements.retry;
}

function createPokemonCard(pokemon) {
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
                    decoding="async"
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

function getPokemonImage(pokemon) {
    return (
        pokemon.sprites?.other?.['official-artwork']?.front_default
        ?? pokemon.sprites?.front_default
        ?? ''
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

    return translations[type] ?? capitalize(type);
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatId(id) {
    return String(id).padStart(3, '0');
}

function hideAllStates() {
    elements.loading.classList.add('hidden');
    elements.error.classList.add('hidden');
    elements.empty.classList.add('hidden');
}

export function renderPokemonDetails(details) {
    const detailSection = document.querySelector('#pokemon-detail');

    detailSection?.classList.remove('hidden');
    detailSection?.setAttribute('aria-hidden', 'false');

    renderGamedex(details);
    scrollToTop();
}

export function hidePokemonDetails() {
    document.dispatchEvent(new CustomEvent('navigation:back-requested'));
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
