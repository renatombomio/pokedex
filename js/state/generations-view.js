import { GENERATIONS } from './generations.js';

const section = document.querySelector('#generations');
const grid = document.querySelector('#generations-grid');

export function initializeGenerations() {
    if (!section || !grid) return;

    renderGenerationCards();
}

function renderGenerationCards() {
    const fragment = document.createDocumentFragment();

    GENERATIONS.forEach((generation) => {
        const card = document.createElement('article');
        card.className = 'generation-card';
        card.dataset.generationId = generation.id;

        const coverPath = `assets/generation-covers/generation-${generation.shortName.toLowerCase()}.png`;

        card.innerHTML = `
            <button class="generation-card-button" type="button" data-generation-id="${generation.id}" aria-label="Explorar ${generation.name}">
                <span class="generation-card-cover" aria-hidden="true"></span>
                <span class="generation-card-top">
                    <span class="generation-number">${generation.shortName}</span>
                    <span class="generation-region">${generation.region}</span>
                </span>
                <span class="generation-card-visual" aria-hidden="true"></span>
                <span class="generation-card-bottom">
                    <strong>${generation.name}</strong>
                    <small>#${generation.start} — #${generation.end}</small>
                    <span class="generation-explore">Explorar ↗</span>
                </span>
            </button>
        `;

        card.querySelector('.generation-card-button')?.style.setProperty('--generation-cover', `url("${coverPath}")`);
        fragment.appendChild(card);
    });

    grid.replaceChildren(fragment);
    grid.onclick = handleGenerationClick;
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
