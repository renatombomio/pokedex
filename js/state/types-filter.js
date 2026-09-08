import { POKEMON_TYPES } from './types.js';
import { filterByType } from './app.js';
import { renderPokemon, showLoading, showError } from './ui.js';

const pokedex = document.querySelector('#pokedex .container');
const loadingState = document.querySelector('#loading-state');

if (pokedex && loadingState) {
    initializePokedexTypeFilters();
}

function initializePokedexTypeFilters() {
    const filters = document.createElement('div');
    filters.className = 'pokedex-type-filters';
    filters.setAttribute('aria-label', 'Filtrar Pokédex por tipo');

    const allButton = createFilterButton('all', 'Todos');
    allButton.classList.add('active');
    allButton.setAttribute('aria-pressed', 'true');
    filters.appendChild(allButton);

    POKEMON_TYPES.forEach((type) => {
        filters.appendChild(createFilterButton(type.id, type.name));
    });

    pokedex.insertBefore(filters, loadingState);
    filters.addEventListener('click', handleFilterClick);

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/pokedex-filters.css';
    document.head.appendChild(stylesheet);
}

function createFilterButton(type, label) {
    const button = document.createElement('button');
    button.className = `filter-button type-${type}`;
    button.type = 'button';
    button.dataset.type = type;
    button.setAttribute('aria-pressed', 'false');
    button.textContent = label;
    return button;
}

async function handleFilterClick(event) {
    const button = event.target.closest('.filter-button');
    if (!button) return;

    const type = button.dataset.type;
    if (!type) return;

    setActiveFilter(type);
    document.dispatchEvent(new CustomEvent('type:filter-changed', {
        detail: { type }
    }));

    try {
        showLoading();
        const state = await filterByType(type);
        renderPokemon(state.filteredPokemon);
    } catch (error) {
        console.error(`Failed to filter Pokémon by type "${type}":`, error);
        showError();
    }
}

function setActiveFilter(type) {
    document
        .querySelectorAll('.pokedex-type-filters .filter-button')
        .forEach((button) => {
            const active = button.dataset.type === type;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
}
