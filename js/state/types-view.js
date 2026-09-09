import { POKEMON_TYPES } from './types.js';
import { getPokemonByType } from '../api/pokemon.js';
import './types-detail.js';

const grid = document.querySelector('#types-grid');

const TYPE_REPRESENTATIVES = {
    normal: 133,
    fire: 6,
    water: 9,
    electric: 807,
    grass: 254,
    ice: 144,
    fighting: 448,
    poison: 94,
    ground: 529,
    flying: 398,
    psychic: 150,
    bug: 212,
    rock: 248,
    ghost: 94,
    dragon: 149,
    dark: 491,
    steel: 823,
    fairy: 700
};

const hydratedTypes = new Set();

export function initializeTypes() {
    if (!grid) return;

    removeLegacyTypeControls();
    renderTypeCards();
    initializeTypeCountHydration();
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

function initializeTypeCountHydration() {
    const cards = grid.querySelectorAll('.type-card');

    if (!('IntersectionObserver' in window)) {
        cards.forEach((card) => hydrateTypeCount(card.dataset.type));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const typeId = entry.target.dataset.type;
            hydrateTypeCount(typeId);
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: '240px 0px'
    });

    cards.forEach((card) => observer.observe(card));
}

async function hydrateTypeCount(typeId) {
    if (!typeId || hydratedTypes.has(typeId)) return;

    const countElement = grid.querySelector(
        `[data-type="${typeId}"] [data-type-count]`
    );

    if (!countElement) return;

    hydratedTypes.add(typeId);

    try {
        const response = await getPokemonByType(typeId);
        countElement.textContent = `${response.pokemon?.length ?? 0} Pokémon`;
    } catch (error) {
        hydratedTypes.delete(typeId);
        console.warn(`Could not load count for type ${typeId}:`, error);
    }
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
