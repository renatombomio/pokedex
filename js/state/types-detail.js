import { getPokemonByType, getPokemon } from '../api/pokemon.js';
import { getPokemonType } from './types.js';
import { renderPokemon, showLoading, showError } from './ui.js';
import { mountWorldBreadcrumb } from './world-navigation.js';

const main = document.querySelector('#main-content');

let requestId = 0;

ensureTypeDetailView();

document.addEventListener('type:open-detail', (event) => {
    const typeId = event.detail?.type;
    if (!typeId) return;

    const navigation = window.__gamedexNavigation;
    navigation?.showTypeDetail?.(typeId, {
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
    mountWorldBreadcrumb(section.querySelector('.container'), [
        { label: 'Mundo Pokémon', action: () => window.location.hash = '#pokedex' },
        { label: 'Tipos', action: () => window.location.hash = '#types' },
        { label: type.name }
    ]);

    try {
        const response = await getPokemonByType(type.id);
        const entries = response.pokemon ?? [];
        const previewEntries = entries.slice(0, 6);
        const pokemon = await loadPokemonEntries(previewEntries);

        if (currentRequest !== requestId) return;

        content.innerHTML = createDetailMarkup(type, entries.length, pokemon);
        mountWorldBreadcrumb(section.querySelector('.container'), [
            { label: 'Mundo Pokémon', action: () => window.location.hash = '#pokedex' },
            { label: 'Tipos', action: () => window.location.hash = '#types' },
            { label: type.name }
        ]);
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

async function loadPokemonEntries(entries) {
    const results = [];
    const batchSize = 12;

    for (let index = 0; index < entries.length; index += batchSize) {
        const batch = entries.slice(index, index + batchSize);
        const loaded = await Promise.all(
            batch.map(({ pokemon }) => getPokemon(pokemon.url ?? pokemon.name))
        );
        results.push(...loaded);
    }

    return results;
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
        const type = getPokemonType(typeId);
        const section = document.querySelector('#type-detail');
        const content = section?.querySelector('[data-type-detail-content]');
        if (!type || !section || !content) return;

        const currentRequest = ++requestId;
        explore.disabled = true;
        explore.textContent = `Cargando Pokémon de tipo ${type.name}…`;

        try {
            const response = await getPokemonByType(typeId);
            const entries = response.pokemon ?? [];
            const pokemon = await loadPokemonEntries(entries);

            if (currentRequest !== requestId) return;

            const grid = content.querySelector('.type-detail-grid');
            const count = content.querySelector('.type-detail-preview-count');
            if (grid) grid.innerHTML = pokemon.map(createPreviewCard).join('');
            if (count) count.textContent = `${pokemon.length} registrados`;
            explore.hidden = true;
        } catch (error) {
            console.error(`Could not load all Pokémon for type ${typeId}:`, error);
            explore.disabled = false;
            explore.textContent = `Reintentar: ver todos los Pokémon de tipo ${type.name}`;
        }
        return;
    }

    const card = event.target.closest('[data-pokemon-id]');
    if (card) {
        const id = Number(card.dataset.pokemonId);
        if (Number.isInteger(id)) {
            const type = sectionType();
            document.dispatchEvent(new CustomEvent('pokemon:open-detail', {
                detail: {
                    id,
                    context: type ? { view: 'type', id: type.id, label: type.name } : null
                }
            }));
        }
    }
}

function sectionType() {
    return getPokemonType(document.querySelector('#type-detail')?.dataset.type);
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
