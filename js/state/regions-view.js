import { REGIONS } from './regions.js';

const section = document.querySelector('#regions');
const grid = document.querySelector('#regions-grid');

export function initializeRegions() {
    if (!section || !grid) return;

    renderRegionCards();
}

function renderRegionCards() {
    const fragment = document.createDocumentFragment();

    REGIONS.forEach((region) => {
        const card = document.createElement('article');
        card.className = 'region-card';
        card.dataset.regionId = region.id;
        card.style.setProperty('--region-accent', region.accent);

        card.innerHTML = `
            <button
                class="region-card-button"
                type="button"
                data-region-id="${region.id}"
                aria-label="Explorar la región ${region.name}"
            >
                <span class="region-card-atmosphere" aria-hidden="true"></span>
                <span class="region-card-header">
                    <span class="region-generation">${region.generation}</span>
                    <span class="region-arrow" aria-hidden="true">↗</span>
                </span>
                <span class="region-visual" data-region-visual>
                    <span class="region-orbit region-orbit-one" aria-hidden="true"></span>
                    <span class="region-orbit region-orbit-two" aria-hidden="true"></span>
                    <span
                        class="region-map-card"
                        style="background-image: url('${region.map}')"
                        role="img"
                        aria-label="Mapa de la región de ${region.name}"
                    ></span>
                </span>
                <span class="region-card-footer">
                    <span>
                        <strong>${region.name}</strong>
                        <small>${region.description}</small>
                    </span>
                    <span class="region-explore">Explorar</span>
                </span>
            </button>
        `;

        fragment.appendChild(card);
    });

    grid.replaceChildren(fragment);
    grid.onclick = handleRegionClick;
}

function handleRegionClick(event) {
    const button = event.target.closest('.region-card-button');
    if (!button) return;

    const regionId = button.dataset.regionId;
    if (!regionId) return;

    document.dispatchEvent(new CustomEvent('region:open-detail', {
        detail: { region: regionId }
    }));
}

initializeRegions();
