import { GENERATIONS } from './generations.js';
import { getPokemon } from '../api/pokemon.js';

const section = document.querySelector('#generations');
const grid = document.querySelector('#generations-grid');

export async function initializeGenerations() {
    if (!section || !grid) return;

    renderGenerationCards();

    try {
        await hydrateStarters();
    } catch (error) {
        console.error('Failed to load generation starters:', error);
    }
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

async function hydrateStarters() {
    const requests = GENERATIONS.flatMap((generation) =>
        generation.starters.map((starter) => getPokemon(starter))
    );

    const starters = await Promise.all(requests);
    const byName = new Map(starters.map((pokemon) => [pokemon.name, pokemon]));

    GENERATIONS.forEach((generation) => {
        const container = grid.querySelector(
            `[data-generation-id="${generation.id}"] [data-generation-starters]`
        );

        if (!container) return;

        const fragment = document.createDocumentFragment();

        generation.starters.forEach((name) => {
            const pokemon = byName.get(name);
            if (!pokemon) return;

            const image = document.createElement('img');
            image.src = pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default || '';
            image.alt = pokemon.name;
            image.loading = 'lazy';
            image.decoding = 'async';
            fragment.appendChild(image);
        });

        container.replaceChildren(fragment);
    });
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
