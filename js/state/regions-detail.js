import { getRegionById } from './regions.js';
import { getGenerationById } from './generations.js';
import { filterByRegion } from './app.js';
import { renderPokemon, showError, showLoading } from './ui.js';
import { getRegion, getPokedex, getPokemon } from '../api/pokemon.js';
import { showHome } from './navigation.js';
import { mountWorldBreadcrumb } from './world-navigation.js';

const MAX_FEATURED_LOCATIONS = 5;

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
    detailElement.dataset.regionId = region.id;
    renderLoadingShell(region);
    detailElement.classList.remove('hidden');
    detailElement.setAttribute('aria-hidden', 'false');

    if (options.pushHistory !== false) {
        window.history.pushState(
            {
                view: 'region',
                region: region.id,
                contextLabel: region.name,
                context: options.context || null
            },
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
    mountWorldBreadcrumb(detailElement.querySelector('.region-detail-container'), [
        { label: 'Mundo Pokémon', action: () => window.location.hash = '#pokedex' },
        { label: 'Regiones', action: () => window.location.hash = '#regions' },
        { label: region.name }
    ]);
}

function renderRegionDetail(region, apiRegion, pokedex, starters) {
    const locations = apiRegion.locations ?? [];
    const featuredLocations = getFeaturedLocations(locations, region);
    const count = pokedex.pokemon_entries?.length ?? 0;
    const generationId = Number(String(region.generation).replace(/\D/g, ''));
    const generation = getGenerationById(generationId);

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
                    ${generation ? `
                        <button class="world-context-link" type="button" data-generation-link="${generation.id}">
                            Ver ${generation.name} →
                        </button>
                    ` : ''}
                </div>

                ${createRegionMap(region)}
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
                        <span class="eyebrow">Localizaciones destacadas</span>
                        <h2 id="region-locations-title">Lugares icónicos de ${region.name}</h2>
                    </div>
                    <span class="region-location-count">${featuredLocations.length} destacados</span>
                </div>
                <div class="region-location-list region-location-grid">
                    ${featuredLocations.length
                        ? featuredLocations.map((location, index) => createLocationCard(location, index, region)).join('')
                        : '<span class="region-location-empty">No hay imágenes de localizaciones disponibles para esta región.</span>'
                    }
                </div>
            </section>
        </div>
    `;

    mountWorldBreadcrumb(detailElement.querySelector('.region-detail-container'), [
        { label: 'Mundo Pokémon', action: () => window.location.hash = '#pokedex' },
        { label: 'Regiones', action: () => window.location.hash = '#regions' },
        { label: region.name }
    ]);
}

function createRegionMap(region) {
    if (!region.map) {
        return `
            <div class="region-map region-map-unavailable" aria-label="Mapa de ${region.name}">
                <span class="region-map-label">MAPA REGIONAL</span>
                <span class="region-map-unavailable-text">Mapa próximamente</span>
            </div>
        `;
    }

    return `
        <figure class="region-map" aria-labelledby="region-map-caption">
            <img
                class="region-map-image"
                src="${region.map}"
                alt="Mapa de la región de ${region.name}"
                decoding="async"
            >
            <figcaption id="region-map-caption" class="region-map-label">MAPA REGIONAL · ${region.name.toUpperCase()}</figcaption>
        </figure>
    `;
}

function getFeaturedLocations(locations, region) {
    return locations
        .map((location) => ({
            location,
            image: getLocationImage(region, location.name)
        }))
        .filter(({ image }) => image)
        .slice(0, MAX_FEATURED_LOCATIONS)
        .map(({ location }) => location);
}

function createLocationCard(location, index, region) {
    const name = formatLocation(location.name);
    const image = getLocationImage(region, location.name);

    return `
        <article class="region-location-card has-image">
            <img src="${image}" alt="${name}" loading="lazy" decoding="async">
            <div class="region-location-card-content">
                <span class="region-location-index">${String(index + 1).padStart(2, '0')}</span>
                <h3>${name}</h3>
            </div>
        </article>
    `;
}

function getLocationImage(region, locationName) {
    if (!region.locationAssets) return '';

    const allowedImages = new Set(region.locationImages ?? []);
    const slug = String(locationName).toLowerCase().trim();

    return allowedImages.has(slug)
        ? `${region.locationAssets}/${slug}.png`
        : '';
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
    mountWorldBreadcrumb(detailElement.querySelector('.region-detail-container'), [
        { label: 'Mundo Pokémon', action: () => window.location.hash = '#pokedex' },
        { label: 'Regiones', action: () => window.location.hash = '#regions' },
        { label: region.name }
    ]);
}

async function handleDetailClick(event) {
    const backButton = event.target.closest('[data-region-back]');
    if (backButton) {
        document.dispatchEvent(new CustomEvent('navigation:back-requested'));
        return;
    }

    const generationLink = event.target.closest('[data-generation-link]');
    if (generationLink) {
        const generationId = Number(generationLink.dataset.generationLink);
        const generation = getGenerationById(generationId);
        document.dispatchEvent(new CustomEvent('generation:open-detail', {
            detail: {
                generation: generationId,
                context: generation ? { view: 'region', id: detailElement.dataset.regionId, label: detailElement.querySelector('#region-detail-title')?.textContent?.trim() || 'Región' } : null
            }
        }));
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
                detail: {
                    id,
                    context: {
                        view: 'region',
                        id: detailElement.dataset.regionId,
                        label: detailElement.querySelector('#region-detail-title')?.textContent?.trim() || 'Región'
                    }
                }
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
        showHome('pokedex', {
            context: {
                view: 'region',
                id: region.id,
                label: region.name
            }
        });
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
