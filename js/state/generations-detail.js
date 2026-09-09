import { GENERATIONS, getGenerationById } from './generations.js';
import { getPokemon } from '../api/pokemon.js';
import { filterByGeneration } from './app.js';
import { showHome } from './navigation.js';

let detailElement = null;
let requestId = 0;

export function initializeGenerationDetail() {
    if (detailElement) return detailElement;

    detailElement = document.createElement('section');
    detailElement.id = 'generation-detail';
    detailElement.className = 'generation-detail hidden';
    detailElement.setAttribute('aria-hidden', 'true');

    const generationsSection = document.querySelector('#generations');
    generationsSection?.after(detailElement);

    document.addEventListener('generation:open-detail', (event) => {
        showGenerationDetail(event.detail?.generation, {
            pushHistory: event.detail?.fromHistory !== true
        });
    });

    return detailElement;
}

export async function showGenerationDetail(generationId, options = {}) {
    const generation = getGenerationById(generationId);
    if (!generation) return;

    initializeGenerationDetail();
    const currentRequest = ++requestId;
    renderLoading(generation);

    if (options.pushHistory !== false) {
        window.history.pushState(
            { view: 'generation', generation: generation.id },
            '',
            `#generation/${generation.id}`
        );
    }

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
    bindBackButton();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderDetail(generation, starters) {
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

    bindBackButton();
    detailElement.querySelector('[data-generation-filter]')?.addEventListener('click', async () => {
        await filterByGeneration(generation);
        showHome('pokedex');
    });

    detailElement.querySelectorAll('[data-pokemon-id]').forEach((button) => {
        button.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('pokemon:open-detail', {
                detail: { id: Number(button.dataset.pokemonId) }
            }));
        });
    });
}

function bindBackButton() {
    detailElement.querySelector('[data-generation-back]')?.addEventListener('click', () => {
        window.history.back();
    });
}

export function getGenerationDetailElement() {
    return detailElement;
}

void GENERATIONS;
