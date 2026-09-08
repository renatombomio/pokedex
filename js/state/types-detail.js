import { getPokemonByType, getPokemon } from '../api/pokemon.js';
import { getPokemonType } from './types.js';
import { filterByType } from './app.js';
import { renderPokemon, showLoading, showError } from './ui.js';
import { showHome, showTypeDetail } from './navigation.js';

const main = document.querySelector('#main-content');

let requestId = 0;

ensureTypeDetailView();

document.addEventListener('type:open-detail', (event) => {
    const typeId = event.detail?.type;
    if (!typeId) return;

    showTypeDetail(typeId, {
        pushHistory: !event.detail?.fromHistory
    });

    loadTypeDetail(typeId);
});

function ensureTypeDetailView() {
    if (!main || document.querySelector('#type-detail')) return;

    const section = document.createElement('section');
    section.className = 'type-detail hidden';
    section.id = 'type-detail';
    section.setAttribute('aria-hidden', 'true');
    section.setAttribute('aria-labelledby', 'type-detail-title');

    section.innerHTML = `
        <div class="container">
            <button class="type-detail-back" type="button" data-type-detail-back>
                ← Volver a Tipos
            </button>
            <div class="type-detail-content" data-type-detail-content></div>
        </div>
    `;

    main.appendChild(section);

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/type-detail.css';
    document.head.appendChild(stylesheet);

    section.addEventListener('click', handleTypeDetailClick);
}

async function loadTypeDetail(typeId) {
    const type = getPokemonType(typeId);
    const section = document.querySelector('#type-detail');
    const content = section?.querySelector('[data-type-detail-content]');

    if (!type || !section || !content) return;

    const currentRequest = ++requestId;

    section.dataset.type = type.id;
    content.innerHTML = createLoadingMarkup(type);

    try {
        const response = await getPokemonByType(type.id);
        const entries = response.pokemon ?? [];
        const previewEntries = entries.slice(0, 6);
        const pokemon = await Promise.all(
            previewEntries.map(({ pokemon }) => getPokemon(pokemon.name))
        );

        if (currentRequest !== requestId) return;

        content.innerHTML = createDetailMarkup(type, entries.length, pokemon);
    } catch (error) {
        if (currentRequest !== requestId) return;

        console.error(`Could not load type ${type.id}:`, error);
        content.innerHTML = `
            <div class="type-detail-error" role="alert">
                <strong>No pudimos cargar este tipo.</strong>
                <span>Inténtalo de nuevo.</span>
                <button type="button" data-retry-type="${type.id}">Reintentar</button>
            </div>
        `;
    }
}

function createLoadingMarkup(type) {
    return `
        <header class="type-detail-hero type-${type.id}">
            <span class="type-detail-kicker">Tipo Pokémon</span>
            <h1 id="type-detail-title">${type.name}</h1>
            <p>${type.description}</p>
        </header>
        <div class="type-detail-loading" aria-live="polite">
            <span></span><span></span><span></span>
        </div>
    `;
}

function createDetailMarkup(type, count, pokemon) {
    return `
        <header class="type-detail-hero type-${type.id}">
            <div>
                <span class="type-detail-kicker">Tipo Pokémon</span>
                <h1 id="type-detail-title">${type.name}</h1>
                <p>${type.description}</p>
            </div>
            <div class="type-detail-count">
                <strong>${count}</strong>
                <span>Pokémon</span>
            </div>
        </header>

        <section class="type-detail-preview" aria-labelledby="type-preview-title">
            <header>
                <div>
                    <span class="type-detail-section-label">Colección</span>
                    <h2 id="type-preview-title">Pokémon de tipo ${type.name}</h2>
                </div>
                <span class="type-detail-preview-count">${count} registrados</span>
            </header>
            <div class="type-detail-grid">
                ${pokemon.map(createPreviewCard).join('')}
            </div>
        </section>

        <div class="type-detail-actions">
            <button class="type-detail-primary" type="button" data-explore-type="${type.id}">
                Ver todos los Pokémon de tipo ${type.name}
            </button>
        </div>
    `;
}

function createPreviewCard(pokemon) {
    const image = pokemon.sprites?.other?.['official-artwork']?.front_default
        || pokemon.sprites?.front_default
        || '';

    return `
        <button class="type-preview-card type-${pokemon.types?.[0]?.type.name ?? 'normal'}" type="button" data-pokemon-id="${pokemon.id}">
            <span class="type-preview-number">#${String(pokemon.id).padStart(3, '0')}</span>
            <img src="${image}" alt="${capitalize(pokemon.name)}" loading="lazy">
            <span>${capitalize(pokemon.name)}</span>
        </button>
    `;
}

async function handleTypeDetailClick(event) {
    const back = event.target.closest('[data-type-detail-back]');
    if (back) {
        document.dispatchEvent(new CustomEvent('navigation:back-requested'));
        return;
    }

    const retry = event.target.closest('[data-retry-type]');
    if (retry) {
        loadTypeDetail(retry.dataset.retryType);
        return;
    }

    const explore = event.target.closest('[data-explore-type]');
    if (explore) {
        const typeId = explore.dataset.exploreType;
        document.dispatchEvent(new CustomEvent('type:filter-changed', {
            detail: { type: typeId }
        }));
        showLoading();

        try {
            const state = await filterByType(typeId);
            renderPokemon(state.filteredPokemon);
            showHome('pokedex');
        } catch (error) {
            console.error(`Could not explore type ${typeId}:`, error);
            showError();
        }
        return;
    }

    const card = event.target.closest('[data-pokemon-id]');
    if (card) {
        const id = Number(card.dataset.pokemonId);
        if (Number.isInteger(id)) {
            document.dispatchEvent(new CustomEvent('pokemon:open-detail', {
                detail: { id }
            }));
        }
    }
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
