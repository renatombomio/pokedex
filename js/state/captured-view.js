import { getPokemon } from '../api/pokemon.js';
import { getCapturedPokemon } from './captured.js';

const elements = {
    section: document.querySelector('#captured'),
    content: document.querySelector('#captured-content'),
    count: document.querySelector('#captured-count')
};

const pokemonCache = new Map();
let renderRequestId = 0;

export function initializeCapturedView() {
    if (!elements.section || !elements.content) return;

    document.addEventListener('captured:changed', handleCapturedChanged);

    elements.content.addEventListener('click', (event) => {
        const card = event.target.closest('.pokemon-card');
        if (!card) return;

        const id = Number(card.dataset.pokemonId);
        if (Number.isInteger(id)) {
            document.dispatchEvent(new CustomEvent('pokemon:open-detail', {
                detail: { id }
            }));
        }
    });

    elements.content.addEventListener('click', (event) => {
        if (!event.target.closest('[data-open-pokedex]')) return;
        document.querySelector('.main-nav a[href="#pokedex"]')?.click();
    });

    updateCapturedCount();
}

export async function renderCapturedView() {
    if (!elements.content) return;

    const requestId = ++renderRequestId;
    const capturedIds = getCapturedPokemon();
    updateCapturedCount(capturedIds.length);
    setCapturedLoading();

    if (capturedIds.length === 0) {
        renderEmptyState();
        return;
    }

    const results = await Promise.allSettled(capturedIds.map(loadCapturedPokemon));
    if (requestId !== renderRequestId) return;

    const pokemon = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    renderCaptured(pokemon, failedCount);
}

async function loadCapturedPokemon(id) {
    if (pokemonCache.has(id)) return pokemonCache.get(id);
    const pokemon = await getPokemon(id);
    pokemonCache.set(id, pokemon);
    return pokemon;
}

function handleCapturedChanged() {
    updateCapturedCount();
    if (elements.section && !elements.section.classList.contains('hidden')) {
        renderCapturedView();
    }
}

function renderCaptured(pokemon, failedCount) {
    if (pokemon.length === 0) {
        renderEmptyState(failedCount > 0 ? 'No pudimos cargar tu colección. Inténtalo de nuevo.' : undefined);
        return;
    }

    const fragment = document.createDocumentFragment();
    pokemon.forEach((entry) => fragment.appendChild(createCapturedCard(entry)));
    elements.content.replaceChildren(fragment);

    if (failedCount > 0) {
        const notice = document.createElement('p');
        notice.className = 'captured-notice';
        notice.textContent = `${failedCount} Pokémon no pudo${failedCount === 1 ? '' : 'ieron'} cargarse.`;
        elements.content.appendChild(notice);
    }
}

function createCapturedCard(pokemon) {
    const article = document.createElement('article');
    article.className = 'pokemon-card captured-pokemon-card';
    article.dataset.pokemonId = pokemon.id;

    const types = (pokemon.types ?? []).map(({ type }) => `
        <span class="pokemon-type type-${type.name}">${translateType(type.name)}</span>
    `).join('');

    article.innerHTML = `
        <button class="pokemon-card-button" type="button" data-pokemon-id="${pokemon.id}" aria-label="Ver ${capitalize(pokemon.name)}">
            <div class="pokemon-card-image">
                <span class="pokemon-number">#${formatId(pokemon.id)}</span>
                <span class="captured-ball-badge" aria-hidden="true"></span>
                <img src="${escapeAttribute(getPokemonImage(pokemon))}" alt="${capitalize(pokemon.name)}" loading="lazy">
            </div>
            <div class="pokemon-card-content">
                <h3>${capitalize(pokemon.name)}</h3>
                <div class="pokemon-types">${types}</div>
            </div>
        </button>
    `;

    return article;
}

function updateCapturedCount(value = getCapturedPokemon().length) {
    if (elements.count) elements.count.textContent = value;
    document.querySelectorAll('[data-captured-count]').forEach((element) => {
        element.textContent = value;
        element.hidden = value === 0;
    });
}

function setCapturedLoading() {
    elements.content.innerHTML = `
        <div class="captured-loading" aria-live="polite">
            <span>Cargando tu colección…</span>
        </div>
    `;
}

function renderEmptyState(message) {
    elements.content.innerHTML = `
        <div class="captured-empty">
            <div class="captured-empty-icon" aria-hidden="true"><span class="captured-ball-icon"></span></div>
            <p class="captured-empty-eyebrow">Tu colección</p>
            <h3>${message ? escapeHtml(message) : 'Todavía no has capturado ningún Pokémon.'}</h3>
            <p>Explora la Pokédex y lanza tu primera Poké Ball.</p>
            <button class="captured-explore" type="button" data-open-pokedex>Explorar Pokédex</button>
        </div>
    `;
}

function getPokemonImage(pokemon) {
    return pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default || '';
}

function translateType(type) {
    const translations = {
        normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
    };
    return translations[type] ?? type;
}

function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
function formatId(id) { return String(id).padStart(3, '0'); }
function escapeHtml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
function escapeAttribute(value) { return escapeHtml(value); }
