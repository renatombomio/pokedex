import { POKEMON_TYPES } from './types.js';
import { getPokemonByType } from '../api/pokemon.js';

const grid = document.querySelector('#types-grid');

export function initializeTypes() {
    if (!grid) return;

    renderTypeCards();
    hydrateTypeCounts();
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

        card.innerHTML = `
            <span class="type-card-shine" aria-hidden="true"></span>
            <span class="type-card-topline">
                <span class="type-card-index">${String(index + 1).padStart(2, '0')}</span>
                <span class="type-card-arrow" aria-hidden="true">↗</span>
            </span>
            <span class="type-card-symbol" aria-hidden="true">${getTypeSymbol(type.id)}</span>
            <span class="type-card-name">${type.name}</span>
            <span class="type-card-description">${type.description}</span>
            <span class="type-card-meta">
                <span class="type-card-count" data-type-count>— Pokémon</span>
                <span class="type-card-cta">Explorar</span>
            </span>
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

function getTypeSymbol(type) {
    const symbols = {
        normal: 'N', fire: 'F', water: 'W', electric: 'E', grass: 'G',
        ice: 'I', fighting: 'L', poison: 'P', ground: 'T', flying: 'V',
        psychic: 'Ψ', bug: 'B', rock: 'R', ghost: 'G', dragon: 'D',
        dark: 'S', steel: 'A', fairy: 'H'
    };

    return symbols[type] ?? '•';
}

initializeTypes();
