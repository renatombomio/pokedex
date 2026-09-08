import { POKEMON_TYPES } from './types.js';
import { getPokemonByType } from '../api/pokemon.js';
import './types-detail.js';

const grid = document.querySelector('#types-grid');

const TYPE_REPRESENTATIVES = {
    normal: 133,
    fire: 6,
    water: 9,
    electric: 25,
    grass: 3,
    ice: 144,
    fighting: 448,
    poison: 94,
    ground: 383,
    flying: 18,
    psychic: 150,
    bug: 212,
    rock: 248,
    ghost: 94,
    dragon: 384,
    dark: 197,
    steel: 376,
    fairy: 700
};

export function initializeTypes() {
    if (!grid) return;

    removeLegacyTypeControls();
    renderTypeCards();
    hydrateTypeCounts();
}

function removeLegacyTypeControls() {
    document
        .querySelectorAll('.types-section > .container > .filter-button')
        .forEach((control) => control.remove());
}

function renderTypeCards() {
    const fragment = document.createDocumentFragment();

    POKEMON_TYPES.forEach((type, index) => {
        const card = document.createElement('button');
        card.className = `type-card filter-button type-${type.id}`;
        card.type = 'button';
        card.dataset.type = type.id;
        card.setAttribute('aria-pressed', 'false');
        card.style.setProperty('--type-index', index);

        const representativeId = TYPE_REPRESENTATIVES[type.id];
        const imageUrl = getRepresentativeImage(representativeId);

        card.innerHTML = `
            <span class="type-card-pokemon" aria-hidden="true">
                <img src="${imageUrl}" alt="" loading="lazy" decoding="async">
            </span>
            <span class="type-card-topline">
                <span class="type-card-index">${String(index + 1).padStart(2, '0')}</span>
                <span class="type-card-arrow" aria-hidden="true">↗</span>
            </span>
            <span class="type-card-symbol" aria-hidden="true">${getTypeSymbol(type.id)}</span>
            <span class="type-card-copy">
                <span class="type-card-name">${type.name}</span>
                <span class="type-card-count" data-type-count>— Pokémon</span>
            </span>
            <span class="type-card-cta" aria-hidden="true">→</span>
        `;

        fragment.appendChild(card);
    });

    grid.replaceChildren(fragment);
}

async function hydrateTypeCounts() {
    const requests = POKEMON_TYPES.map(async (type) => {
        try {
            const response = await getPokemonByType(type.id);
            return [type.id, response.pokemon?.length ?? 0];
        } catch (error) {
            console.warn(`Could not load count for type ${type.id}:`, error);
            return [type.id, null];
        }
    });

    const results = await Promise.all(requests);

    results.forEach(([typeId, count]) => {
        const card = grid?.querySelector(`[data-type="${typeId}"]`);
        const countElement = card?.querySelector('[data-type-count]');

        if (!countElement || count === null) return;
        countElement.textContent = `${count} Pokémon`;
    });
}

grid?.addEventListener('click', (event) => {
    const card = event.target.closest('.type-card');
    if (!card) return;

    event.stopPropagation();

    const typeId = card.dataset.type;
    if (!typeId) return;

    document.dispatchEvent(new CustomEvent('type:open-detail', {
        detail: { type: typeId }
    }));
});

document.addEventListener('type:filter-changed', (event) => {
    const type = event.detail?.type;

    document.querySelectorAll('.type-card').forEach((card) => {
        const active = type !== 'all' && card.dataset.type === type;
        card.classList.toggle('active', active);
        card.setAttribute('aria-pressed', String(active));
    });
});

function getRepresentativeImage(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function getTypeSymbol(type) {
    const symbols = {
        normal: '✦', fire: 'ϟ', water: '◒', electric: 'ϟ', grass: '✤',
        ice: '❄', fighting: '✕', poison: '☣', ground: '⌁', flying: '➤',
        psychic: '◉', bug: '⌘', rock: '◆', ghost: '◌', dragon: '◈',
        dark: '◐', steel: '⬡', fairy: '✧'
    };

    return symbols[type] ?? '•';
}

initializeTypes();
