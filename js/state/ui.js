import {
    renderGamedex,
    hideGamedex
} from './gamedex.js';


const elements = {
    grid: document.querySelector('#pokemon-grid'),
    count: document.querySelector('#pokemon-count'),
    loading: document.querySelector('#loading-state'),
    error: document.querySelector('#error-state'),
    empty: document.querySelector('#empty-state'),
    retry: document.querySelector('#retry-button')
};


/**
 * Render the current Pokémon collection.
 */
export function renderPokemon(pokemon) {
    hideAllStates();
    elements.count.textContent = pokemon.length;

    if (pokemon.length === 0) {
        elements.empty.classList.remove('hidden');
        return;
    }

    const fragment = document.createDocumentFragment();

    pokemon.forEach((entry) => {
        fragment.appendChild(createPokemonCard(entry));
    });

    elements.grid.replaceChildren(fragment);
}


/**
 * Show loading state.
 */
export function showLoading() {
    elements.grid.replaceChildren();
    hideAllStates();
    elements.loading.classList.remove('hidden');
}


/**
 * Show error state.
 */
export function showError() {
    elements.grid.replaceChildren();
    hideAllStates();
    elements.error.classList.remove('hidden');
}


/**
 * Return the retry button.
 */
export function getRetryButton() {
    return elements.retry;
}


/**
 * Create a Pokémon card.
 */
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
                <span class="pokemon-number">
                    #${formatId(pokemon.id)}
                </span>

                <img
                    src="${getPokemonImage(pokemon)}"
                    alt="${capitalize(pokemon.name)}"
                    loading="lazy"
                >
            </div>

            <div class="pokemon-card-content">
                <h3>${capitalize(pokemon.name)}</h3>
                <div class="pokemon-types">
                    ${types}
                </div>
            </div>
        </button>
    `;

    return article;
}


/**
 * Get the best available Pokémon artwork.
 */
function getPokemonImage(pokemon) {
    return (
        pokemon.sprites?.other?.['official-artwork']?.front_default
        ??
        pokemon.sprites?.front_default
        ??
        ''
    );
}


/**
 * Translate PokéAPI type names.
 */
function translateType(type) {
    const translations = {
        normal: 'Normal',
        fire: 'Fuego',
        water: 'Agua',
        electric: 'Eléctrico',
        grass: 'Planta',
        ice: 'Hielo',
        fighting: 'Lucha',
        poison: 'Veneno',
        ground: 'Tierra',
        flying: 'Volador',
        psychic: 'Psíquico',
        bug: 'Bicho',
        rock: 'Roca',
        ghost: 'Fantasma',
        dragon: 'Dragón',
        dark: 'Siniestro',
        steel: 'Acero',
        fairy: 'Hada'
    };

    return translations[type] ?? capitalize(type);
}


/**
 * Capitalize Pokémon names.
 */
function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}


/**
 * Format Pokédex number.
 */
function formatId(id) {
    return String(id).padStart(3, '0');
}


/**
 * Hide every application state.
 */
function hideAllStates() {
    elements.loading.classList.add('hidden');
    elements.error.classList.add('hidden');
    elements.empty.classList.add('hidden');
}


/**
 * Render Pokémon detail view.
 */
export function renderPokemonDetails(details) {
    const detailSection = document.querySelector('#pokemon-detail');
    const heroSection = document.querySelector('.hero');
    const pokedexSection = document.querySelector('#pokedex');
    const favoritesSection = document.querySelector('#favorites');

    heroSection?.classList.add('hidden');
    pokedexSection?.classList.add('hidden');
    favoritesSection?.classList.add('hidden');

    detailSection.classList.remove('hidden');
    detailSection.setAttribute('aria-hidden', 'false');

    renderGamedex(details);
    scrollToTop();
}


/**
 * Hide Pokémon detail view.
 */
export function hidePokemonDetails() {
    const detailSection = document.querySelector('#pokemon-detail');
    const heroSection = document.querySelector('.hero');
    const pokedexSection = document.querySelector('#pokedex');
    const favoritesSection = document.querySelector('#favorites');

    detailSection.classList.add('hidden');
    detailSection.setAttribute('aria-hidden', 'true');

    heroSection?.classList.remove('hidden');
    pokedexSection?.classList.remove('hidden');
    favoritesSection?.classList.remove('hidden');

    hideGamedex();
    scrollToTop();
}


function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
}


function prefersReducedMotion() {
    return window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;
}
