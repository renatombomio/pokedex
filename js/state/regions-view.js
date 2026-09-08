import { REGIONS } from './regions.js';
import { getPokemon } from '../api/pokemon.js';
import { filterByRegion } from './app.js';
import { renderPokemon, showLoading, showError } from './ui.js';
import { showHome } from './navigation.js';


const section = document.querySelector('#regions');
const grid = document.querySelector('#regions-grid');


export async function initializeRegions() {
    if (!section || !grid) {
        return;
    }

    renderRegionShells();

    try {
        await hydrateStarters();
    } catch (error) {
        console.error('Failed to load region starters:', error);
    }
}


function renderRegionShells() {
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
                    <span class="region-starters" data-region-starters></span>
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

    grid.addEventListener('click', handleRegionClick);
}


async function hydrateStarters() {
    const starterRequests = REGIONS.flatMap((region) =>
        region.starters.map((starter) =>
            getPokemon(starter)
        )
    );

    const starters = await Promise.all(starterRequests);
    const byName = new Map(
        starters.map((pokemon) => [pokemon.name, pokemon])
    );

    REGIONS.forEach((region) => {
        const container = grid.querySelector(
            `[data-region-id="${region.id}"] [data-region-starters]`
        );

        if (!container) {
            return;
        }

        const fragment = document.createDocumentFragment();

        region.starters.forEach((name) => {
            const pokemon = byName.get(name);

            if (!pokemon) {
                return;
            }

            const wrapper = document.createElement('span');
            wrapper.className = 'region-starter';
            wrapper.title = pokemon.name;

            const image = document.createElement('img');
            image.src =
                pokemon.sprites?.other?.['official-artwork']?.front_default ||
                pokemon.sprites?.front_default ||
                '';
            image.alt = pokemon.name;
            image.loading = 'lazy';

            wrapper.appendChild(image);
            fragment.appendChild(wrapper);
        });

        container.replaceChildren(fragment);
    });
}


async function handleRegionClick(event) {
    const button = event.target.closest('.region-card-button');

    if (!button) {
        return;
    }

    const region = REGIONS.find(
        (item) => item.id === button.dataset.regionId
    );

    if (!region) {
        return;
    }

    button.disabled = true;
    button.classList.add('is-loading');

    try {
        showLoading();

        const state = await filterByRegion(region);

        renderPokemon(state.filteredPokemon);
        showHome('pokedex');
    } catch (error) {
        console.error(
            `Could not open region ${region.name}:`,
            error
        );
        showError();
    } finally {
        button.disabled = false;
        button.classList.remove('is-loading');
    }
}
