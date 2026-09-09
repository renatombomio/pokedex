import { GENERATIONS } from './generations.js';
import { getPokemon } from '../api/pokemon.js';

const section = document.querySelector('#generations');
const grid = document.querySelector('#generations-grid');

const hydratedGenerations = new Set();

export function initializeGenerations() {
    if (!section || !grid) return;

    renderGenerationCards();
    initializeStarterHydration();
}

function renderGenerationCards() {
    const fragment = document.createDocumentFragment();

    GENERATIONS.forEach((generation) => {
        const card = document.createElement('article');
        card.className = 'generation-card';
        card.dataset.generationId = generation.id;

        card.innerHTML = `
            <button class="generation-card-button" type="button" data-generation-id="${generation.id}" aria-label="Explorar ${generation.name}">
                <span class="generation-card-top">
                    <span class="generation-number">${generation.shortName}</span>
                    <span class="generation-region">${generation.region}</span>
                </span>
                <span class="generation-card-visual">
                    <span class="generation-orbit generation-orbit-one" aria-hidden="true"></span>
                    <span class="generation-orbit generation-orbit-two" aria-hidden="true"></span>
                    <span class="generation-starters" data-generation-starters></span>
                </span>
                <span class="generation-card-bottom">
                    <strong>${generation.name}</strong>
                    <small>#${generation.start} — #${generation.end}</small>
                    <span class="generation-explore">Explorar ↗</span>
                </span>
            </button>
        `;

        fragment.appendChild(card);
    });

    grid.replaceChildren(fragment);
    grid.onclick = handleGenerationClick;
}

function initializeStarterHydration() {
    const cards = grid.querySelectorAll('.generation-card');

    if (!('IntersectionObserver' in window)) {
        cards.forEach((card) => {
            hydrateGenerationStarters(Number(card.dataset.generationId));
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const generationId = Number(entry.target.dataset.generationId);
            hydrateGenerationStarters(generationId);
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: '240px 0px'
    });

    cards.forEach((card) => observer.observe(card));
}

async function hydrateGenerationStarters(generationId) {
    if (hydratedGenerations.has(generationId)) return;

    const generation = GENERATIONS.find((item) => item.id === generationId);
    const container = grid.querySelector(
        `[data-generation-id="${generationId}"] [data-generation-starters]`
    );

    if (!generation || !container) return;

    hydratedGenerations.add(generationId);

    try {
        const starters = await Promise.all(
            generation.starters.map((starter) => getPokemon(starter))
        );

        const fragment = document.createDocumentFragment();

        starters.forEach((pokemon) => {
            const image = document.createElement('img');
            image.src = pokemon.sprites?.other?.['official-artwork']?.front_default
                || pokemon.sprites?.front_default
                || '';
            image.alt = pokemon.name;
            image.loading = 'lazy';
            image.decoding = 'async';
            fragment.appendChild(image);
        });

        container.replaceChildren(fragment);
    } catch (error) {
        hydratedGenerations.delete(generationId);
        throw error;
    }
}

function handleGenerationClick(event) {
    const button = event.target.closest('.generation-card-button');
    if (!button) return;

    const generationId = Number(button.dataset.generationId);
    if (!Number.isInteger(generationId)) return;

    document.dispatchEvent(new CustomEvent('generation:open-detail', {
        detail: { generation: generationId }
    }));
}

initializeGenerations();
