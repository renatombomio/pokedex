import { REGIONS, getRegionById } from './regions.js';
import { filterByRegion } from './app.js';
import { renderPokemon, showError, showLoading } from './ui.js';
import { getRegion, getPokedex, getPokemon } from '../api/pokemon.js';
import { showHome } from './navigation.js';

let detailElement = null;
let requestId = 0;

export function initializeRegionDetail() {
    if (detailElement) return;

    detailElement = document.createElement('section');
    detailElement.id = 'region-detail';
    detailElement.className = 'region-detail hidden';
    detailElement.setAttribute('aria-hidden', 'true');
    detailElement.setAttribute('aria-labelledby', 'region-detail-title');

    const regionsSection = document.querySelector('#regions');
    regionsSection?.after(detailElement);

    detailElement.addEventListener('click', handleDetailClick);
}

export async function showRegionDetail(regionId, options = {}) {
    initializeRegionDetail();

    const region = getRegionById(regionId);
    if (!region || !detailElement) return;

    const currentRequest = ++requestId;
    renderLoadingShell(region);
    detailElement.classList.remove('hidden');
    detailElement.setAttribute('aria-hidden', 'false');

    if (options.pushHistory !== false) {
        window.history.pushState(
            { view: 'region', region: region.id },
            '',
            `#region/${region.id}`
        );
    }

    window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });

    try {
        const [apiRegion, pokedex, starters] = await Promise.all([
            getRegion(region.id),
            getPokedex(region.pokedex),
            Promise.all(region.starters.map((name) => getPokemon(name)))
        ]);

        if (currentRequest !== requestId) return;

        renderRegionDetail(region, apiRegion, pokedex, starters);
    } catch (error) {
        if (currentRequest !== requestId) return;
        console.error(`Could not load region ${region.name}:`, error);
        renderError(region);
    }
}

function renderLoadingShell(region) {
    detailElement.innerHTML = `
        <div class="container region-detail-container">
            <button class="region-detail-back" type="button" data-region-back>← Volver a Regiones</button>
            <div class="region-detail-loading">
                <span class="eyebrow">${region.generation}</span>
                <h1 id="region-detail-title">${region.name}</h1>
                <p>Cargando información de la región...</p>
            </div>
        </div>
    `;
}

function renderRegionDetail(region, apiRegion, pokedex, starters) {
    const locations = (apiRegion.locations ?? []).slice(0, 8);
    const count = pokedex.pokemon_entries?.length ?? 0;

    detailElement.innerHTML = `
        <div class="container region-detail-container">
            <button class="region-detail-back" type="button" data-region-back>← Volver a Regiones</button>

            <header class="region-detail-hero" style="--region-accent: ${region.accent}">
                <div class="region-detail-heading">
                    <span class="eyebrow">${region.generation}</span>
                    <h1 id="region-detail-title">${region.name}</h1>
                    <p>${region.description}</p>
                    <div class="region-detail-meta">
                        <span><strong>${count}</strong> Pokémon</span>
                        <span><strong>${locations.length || '—'}</strong> localizaciones</span>
                    </div>
                </div>

                <div class="region-map" aria-label="Mapa esquemático de ${region.name}">
                    <div class="region-map-grid" aria-hidden="true"></div>
                    <div class="region-map-land region-map-land-${region.id}" aria-hidden="true"></div>
                    <span class="region-map-label">MAPA REGIONAL</span>
                    ${locations.map((location, index) => `
                        <span class="region-map-pin region-map-pin-${index + 1}" title="${formatLocation(location.name)}" aria-hidden="true">
                            <i></i>
                        </span>
                    `).join('')}
                    <span class="region-map-compass" aria-hidden="true">N</span>
                </div>
            </header>

            <section class="region-explorer-panel" aria-labelledby="region-explorer-title">
                <div class="region-panel-heading">
                    <div>
                        <span class="eyebrow">Primeros compañeros</span>
                        <h2 id="region-explorer-title">Elige tu equipo</h2>
                    </div>
                    <button class="region-pokedex-link" type="button" data-region-explore="${region.id}">
                        Explorar toda la Pokédex →
                    </button>
                </div>

                <div class="region-starter-showcase">
                    ${starters.map((pokemon) => createStarter(pokemon, region)).join('')}
                </div>
            </section>

            <section class="region-locations" aria-labelledby="region-locations-title">
                <div class="region-panel-heading">
                    <div>
                        <span class="eyebrow">Territorio</span>
                        <h2 id="region-locations-title">Lugares de ${region.name}</h2>
                    </div>
                    <span class="region-location-count">${apiRegion.locations?.length ?? 0} lugares registrados</span>
                </div>
                <div class="region-location-list">
                    ${locations.length
                        ? locations.map((location, index) => `
                            <span class="region-location-item">
                                <b>${String(index + 1).padStart(2, '0')}</b>
                                <span>${formatLocation(location.name)}</span>
                            </span>
                        `).join('')
                        : '<span class="region-location-empty">Información de localizaciones no disponible.</span>'
                    }
                </div>
            </section>
        </div>
    `;
}

function createStarter(pokemon, region) {
    const artwork = pokemon.sprites?.other?.['official-artwork']?.front_default
        || pokemon.sprites?.front_default
        || '';

    return `
        <button class="region-starter-card" type="button" data-pokemon-id="${pokemon.id}" style="--region-accent: ${region.accent}">
            <span class="region-starter-number">#${String(pokemon.id).padStart(3, '0')}</span>
            <img src="${artwork}" alt="${capitalize(pokemon.name)}" loading="lazy" decoding="async">
            <span class="region-starter-name">${capitalize(pokemon.name)}</span>
            <span class="region-starter-open">Ver Gamedex ↗</span>
        </button>
    `;
}

function renderError(region) {
    detailElement.innerHTML = `
        <div class="container region-detail-container">
            <button class="region-detail-back" type="button" data-region-back>← Volver a Regiones</button>
            <div class="region-detail-error">
                <span class="eyebrow">${region.generation}</span>
                <h1 id="region-detail-title">No pudimos abrir ${region.name}</h1>
                <p>La información de la región no está disponible ahora mismo.</p>
                <button type="button" data-region-retry="${region.id}">Intentar otra vez</button>
            </div>
        </div>
    `;
}

async function handleDetailClick(event) {
    const backButton = event.target.closest('[data-region-back]');
    if (backButton) {
        document.dispatchEvent(new CustomEvent('navigation:back-requested'));
        return;
    }

    const retryButton = event.target.closest('[data-region-retry]');
    if (retryButton) {
        showRegionDetail(retryButton.dataset.regionRetry, { pushHistory: false });
        return;
    }

    const pokemonCard = event.target.closest('[data-pokemon-id]');
    if (pokemonCard) {
        const id = Number(pokemonCard.dataset.pokemonId);
        if (Number.isInteger(id)) {
            document.dispatchEvent(new CustomEvent('pokemon:open-detail', {
                detail: { id }
            }));
        }
        return;
    }

    const exploreButton = event.target.closest('[data-region-explore]');
    if (!exploreButton) return;

    const region = getRegionById(exploreButton.dataset.regionExplore);
    if (!region) return;

    try {
        exploreButton.disabled = true;
        showLoading();
        const state = await filterByRegion(region);
        renderPokemon(state.filteredPokemon);
        showHome('pokedex');
    } catch (error) {
        console.error(`Could not explore region ${region.name}:`, error);
        showError();
    } finally {
        exploreButton.disabled = false;
    }
}

function formatLocation(name) {
    return name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
