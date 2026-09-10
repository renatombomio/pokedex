import { getGenerationById } from './generations.js';
import { REGIONS } from './regions.js';
import { getPokemon } from '../api/pokemon.js';
import { filterByGeneration } from './app.js';
import { showHome } from './navigation.js';
import { mountWorldBreadcrumb } from './world-navigation.js';

let detailElement = null;
let requestId = 0;

export function initializeGenerationDetail() {
    if (detailElement) return detailElement;

    detailElement = document.createElement('section');
    detailElement.id = 'generation-detail';
    detailElement.className = 'generation-detail hidden';
    detailElement.setAttribute('aria-hidden', 'true');

    document.querySelector('#generations')?.after(detailElement);
    return detailElement;
}

export async function showGenerationDetail(generationId, options = {}) {
    const generation = getGenerationById(generationId);
    if (!generation) return;

    initializeGenerationDetail();
    const currentRequest = ++requestId;
    detailElement.dataset.generationId = String(generation.id);
    renderLoading(generation);

    // History is owned by navigation.js. This view only renders the generation.

    try {
        const starters = await Promise.all(generation.starters.map((name) => getPokemon(name)));
        if (currentRequest !== requestId) return;
        renderDetail(generation, starters);
    } catch (error) {
        if (currentRequest !== requestId) return;
        detailElement.innerHTML = `
            <div class="container generation-detail-inner">
                <button class="generation-back" type="button" data-generation-back>← Volver a Generaciones</button>
                <div class="generation-detail-error"><h2>No pudimos cargar esta generación.</h2><p>Inténtalo de nuevo.</p></div>
            </div>
        `;
        mountBreadcrumbs(generation);
        bindBackButton();
        console.error('Failed to load generation detail:', error);
    }
}

function renderLoading(generation) {
    detailElement.classList.remove('hidden');
    detailElement.setAttribute('aria-hidden', 'false');
    detailElement.innerHTML = `
        <div class="container generation-detail-inner">
            <button class="generation-back" type="button" data-generation-back>← Volver a Generaciones</button>
            <p class="eyebrow">${generation.name}</p>
            <h2>Cargando generación…</h2>
        </div>
    `;
    mountBreadcrumbs(generation);
    bindBackButton();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderDetail(generation, starters) {
    const region = getRegionForGeneration(generation);

    detailElement.innerHTML = `
        <div class="container generation-detail-inner">
            <button class="generation-back" type="button" data-generation-back>← Volver a Generaciones</button>
            <header class="generation-detail-header">
                <p class="eyebrow">${generation.name}</p>
                <h2>${generation.region}</h2>
                <p>${generation.description}</p>
                <div class="generation-detail-meta">
                    <span>#${generation.start} — #${generation.end}</span>
                    <span>${generation.end - generation.start + 1} especies</span>
                </div>
                ${region ? `
                    <button class="world-context-link" type="button" data-region-link="${region.id}">
                        Ver región ${region.name} →
                    </button>
                ` : ''}
            </header>
            <section class="generation-starter-panel" aria-labelledby="generation-starters-title">
                <div><p class="eyebrow">Pokémon iniciales</p><h3 id="generation-starters-title">Elige tu comienzo</h3></div>
                <div class="generation-starter-grid">
                    ${starters.map((pokemon) => `
                        <button class="generation-starter-card" type="button" data-pokemon-id="${pokemon.id}">
                            <span>#${String(pokemon.id).padStart(3, '0')}</span>
                            <img src="${pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default || ''}" alt="${pokemon.name}" loading="lazy">
                            <strong>${pokemon.name}</strong>
                        </button>
                    `).join('')}
                </div>
            </section>
            <button class="generation-pokedex-cta" type="button" data-generation-filter="${generation.id}">
                <span><small>EXPLORAR GENERACIÓN</small><strong>Ver todos los Pokémon de ${generation.name}</strong></span>
                <span aria-hidden="true">↗</span>
            </button>
        </div>
    `;

    mountBreadcrumbs(generation);
    bindBackButton();

    detailElement.querySelector('[data-region-link]')?.addEventListener('click', () => {
        if (!region) return;
        document.dispatchEvent(new CustomEvent('region:open-detail', {
            detail: {
                region: region.id,
                context: { view: 'generation', id: generation.id, label: generation.name }
            }
        }));
    });

    detailElement.querySelector('[data-generation-filter]')?.addEventListener('click', async () => {
        await filterByGeneration(generation);
        showHome('pokedex');
    });

    detailElement.querySelectorAll('[data-pokemon-id]').forEach((button) => {
        button.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('pokemon:open-detail', {
                detail: {
                    id: Number(button.dataset.pokemonId),
                    context: { view: 'generation', id: generation.id, label: generation.name }
                }
            }));
        });
    });
}

function mountBreadcrumbs(generation) {
    mountWorldBreadcrumb(detailElement.querySelector('.generation-detail-inner'), [
        { label: 'Mundo Pokémon', action: () => window.location.hash = '#pokedex' },
        { label: 'Generaciones', action: () => window.location.hash = '#generations' },
        { label: generation.name }
    ]);
}

function getRegionForGeneration(generation) {
    const normalized = generation.region.toLowerCase();
    return REGIONS.find((region) => {
        const regionName = region.name.toLowerCase();
        return normalized === regionName || normalized.startsWith(regionName.split('/')[0].trim());
    }) ?? null;
}

function bindBackButton() {
    detailElement.querySelector('[data-generation-back]')?.addEventListener('click', () => {
        window.history.back();
    });
}

export function getGenerationDetailElement() {
    return detailElement;
}
