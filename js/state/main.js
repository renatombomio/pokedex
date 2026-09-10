import {
    initializeApp,
    loadMorePokemon,
    searchPokemon
} from './app.js';

import {
    renderPokemon,
    hidePokemonDetails,
    showLoading,
    showError,
    getRetryButton
} from './ui.js';


const searchForm =
    document.querySelector('#search-form');

const searchInput =
    document.querySelector('#search-input');

const loadMoreButton =
    document.querySelector('#load-more-button');

const pokemonGrid =
    document.querySelector('#pokemon-grid');

const detailBackButton =
    document.querySelector('#detail-back');


/* ========================================
   SEARCH MODAL
======================================== */

const searchModal = createSearchModal();

function createSearchModal() {
    const modal = document.createElement('div');

    modal.className = 'search-modal';
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="search-modal-backdrop" data-close-search></div>

        <section
            class="search-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
        >
            <header class="search-modal-header">
                <div>
                    <p class="search-modal-eyebrow">Resultados</p>
                    <h2 id="search-modal-title">Pokémon encontrados</h2>
                    <p class="search-modal-query" id="search-modal-query"></p>
                </div>

                <button
                    class="search-modal-close"
                    type="button"
                    aria-label="Cerrar resultados"
                    data-close-search
                >
                    ×
                </button>
            </header>

            <div class="search-modal-results" id="search-modal-results"></div>
        </section>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (event) => {
        if (event.target.closest('[data-close-search]')) {
            closeSearchModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (
            event.key === 'Escape' &&
            modal.classList.contains('is-open')
        ) {
            closeSearchModal();
        }
    });

    return modal;
}

function openSearchModal(query, pokemon) {
    const queryElement =
        searchModal.querySelector('#search-modal-query');

    const resultsElement =
        searchModal.querySelector('#search-modal-results');

    queryElement.textContent =
        `${pokemon.length} resultado${pokemon.length === 1 ? '' : 's'} para “${query}”`;

    resultsElement.replaceChildren();

    if (pokemon.length === 0) {
        resultsElement.innerHTML = `
            <div class="search-modal-empty">
                <strong>No encontramos ningún Pokémon.</strong>
                <span>Prueba con otro nombre o número.</span>
            </div>
        `;
    } else {
        const fragment = document.createDocumentFragment();

        pokemon.forEach((entry) => {
            fragment.appendChild(
                createSearchResultCard(entry)
            );
        });

        resultsElement.appendChild(fragment);
    }

    searchModal.classList.add('is-open');
    searchModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
}

function closeSearchModal() {
    searchModal.classList.remove('is-open');
    searchModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
}

function createSearchResultCard(pokemon) {
    const article = document.createElement('article');

    article.className = 'search-result-card';
    article.dataset.pokemonId = pokemon.id;

    const primaryType =
        pokemon.types?.[0]?.type.name ?? 'normal';

    const types =
        pokemon.types
            .map(({ type }) => `
                <span class="pokemon-type type-${type.name}">
                    ${translateType(type.name)}
                </span>
            `)
            .join('');

    article.innerHTML = `
        <button
            class="search-result-button type-${primaryType}"
            type="button"
            data-pokemon-id="${pokemon.id}"
            aria-label="Ver ${capitalize(pokemon.name)}"
        >
            <span class="search-result-number">
                #${formatId(pokemon.id)}
            </span>

            <span class="search-result-image">
                <img
                    src="${getPokemonImage(pokemon)}"
                    alt="${capitalize(pokemon.name)}"
                >
            </span>

            <span class="search-result-content">
                <strong>${capitalize(pokemon.name)}</strong>
                <span class="pokemon-types">${types}</span>
            </span>
        </button>
    `;

    return article;
}


/* ========================================
   START
======================================== */

async function start() {
    showLoading();

    try {
        const state = await initializeApp();

        renderPokemon(state.filteredPokemon);
    } catch (error) {
        console.error(
            'Failed to start Pokédex:',
            error
        );

        showError();
    }
}


/* ========================================
   SEARCH
======================================== */

searchForm.addEventListener(
    'submit',
    async (event) => {
        event.preventDefault();

        const query = searchInput.value.trim();

        if (!query) {
            searchInput.focus();
            return;
        }

        try {
            searchForm.classList.add('is-loading');

            const state = await searchPokemon(query);

            openSearchModal(
                query,
                state.filteredPokemon
            );
        } catch (error) {
            console.error(
                'Failed to search Pokémon:',
                error
            );

            showError();
        } finally {
            searchForm.classList.remove('is-loading');
        }
    }
);


/* ========================================
   SEARCH RESULT → DETAIL
======================================== */

searchModal.addEventListener(
    'click',
    (event) => {
        const card = event.target.closest('.search-result-card');

        if (!card) {
            return;
        }

        const pokemonId = Number(card.dataset.pokemonId);

        if (!Number.isInteger(pokemonId)) {
            return;
        }

        closeSearchModal();

        document.dispatchEvent(
            new CustomEvent('pokemon:open-detail', {
                detail: { id: pokemonId }
            })
        );
    }
);


/* ========================================
   GRID → DETAIL
======================================== */

pokemonGrid.addEventListener(
    'click',
    (event) => {
        const card = event.target.closest('.pokemon-card');

        if (!card) {
            return;
        }

        const pokemonId = Number(card.dataset.pokemonId);

        if (!Number.isInteger(pokemonId)) {
            return;
        }

        document.dispatchEvent(
            new CustomEvent('pokemon:open-detail', {
                detail: {
                    id: pokemonId,
                    context: window.history.state?.context || null
                }
            })
        );
    }
);


/* ========================================
   BACK TO POKÉDEX
======================================== */

detailBackButton.addEventListener(
    'click',
    () => {
        hidePokemonDetails();
    }
);


/* ========================================
   LOAD MORE
======================================== */

if (loadMoreButton) {
    loadMoreButton.addEventListener(
        'click',
        async () => {
            loadMoreButton.disabled = true;
            loadMoreButton.textContent = 'Cargando...';

            try {
                const state = await loadMorePokemon();

                renderPokemon(state.filteredPokemon);
            } catch (error) {
                console.error(
                    'Failed to load more Pokémon:',
                    error
                );
            } finally {
                loadMoreButton.disabled = false;
                loadMoreButton.textContent =
                    'Cargar más Pokémon';
            }
        }
    );
}


/* ========================================
   RETRY
======================================== */

getRetryButton().addEventListener(
    'click',
    start
);


/* ========================================
   HELPERS
======================================== */

function getPokemonImage(pokemon) {
    return (
        pokemon.sprites?.other?.['official-artwork']?.front_default ||
        pokemon.sprites?.front_default ||
        ''
    );
}

function formatId(id) {
    return String(id).padStart(3, '0');
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function translateType(type) {
    const translations = {
        normal: 'Normal',
        fire: 'Fuego',
        water: 'Agua',
        electric: 'Eléctrico',
        grass: 'Planta',
        ice: 'Hielo',
        fighting: 'Lucha',
        poison: 'Veneno',
        ground: 'Tierra',
        flying: 'Volador',
        psychic: 'Psíquico',
        bug: 'Bicho',
        rock: 'Roca',
        ghost: 'Fantasma',
        dragon: 'Dragón',
        dark: 'Siniestro',
        steel: 'Acero',
        fairy: 'Hada'
    };

    return translations[type] ?? type;
}


/* ========================================
   SEARCH MODAL STYLES
======================================== */

const searchModalStyles = document.createElement('style');

searchModalStyles.textContent = `
    body.modal-open {
        overflow: hidden;
    }

    .search-modal {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        padding: 28px;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity .2s ease, visibility .2s ease;
    }

    .search-modal.is-open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
    }

    .search-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 15, 15, .72);
        backdrop-filter: blur(8px);
    }

    .search-modal-panel {
        position: relative;
        z-index: 1;
        width: min(100%, 1080px);
        max-height: min(760px, calc(100vh - 56px));
        padding: 28px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.55);
        border-radius: 28px;
        background: #fff;
        box-shadow: 0 30px 90px rgba(0,0,0,.28);
        transform: translateY(18px) scale(.98);
        transition: transform .25s ease;
    }

    .search-modal.is-open .search-modal-panel {
        transform: translateY(0) scale(1);
    }

    .search-modal-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 24px;
    }

    .search-modal-eyebrow {
        margin-bottom: 6px;
        color: #e3350d;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .14em;
        text-transform: uppercase;
    }

    .search-modal-header h2 {
        margin: 0;
        color: #171717;
        font-size: clamp(28px, 4vw, 42px);
        line-height: 1;
        letter-spacing: -.05em;
    }

    .search-modal-query {
        margin-top: 8px;
        color: #737373;
        font-size: 13px;
    }

    .search-modal-close {
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        border: 1px solid #e5e5e5;
        border-radius: 50%;
        background: #fff;
        color: #171717;
        font-size: 26px;
        line-height: 1;
        transition: transform .2s ease, background .2s ease;
    }

    .search-modal-close:hover {
        transform: rotate(6deg);
        background: #f5f5f5;
    }

    .search-modal-results {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(260px, 1fr);
        grid-template-rows: 1fr;
        gap: 18px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 4px 2px 12px;
        scroll-snap-type: x mandatory;
        scrollbar-width: thin;
    }

    .search-result-card {
        min-width: 0;
        scroll-snap-align: start;
    }

    .search-result-button {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: 390px;
        padding: 0;
        overflow: hidden;
        border: 2px solid transparent;
        border-radius: 22px;
        background: #f5f5f5;
        color: #171717;
        text-align: left;
        box-shadow: 0 10px 28px rgba(0,0,0,.07);
        transition: transform .22s ease, box-shadow .22s ease;
    }

    .search-result-button:hover {
        transform: translateY(-5px);
        box-shadow: 0 18px 36px rgba(0,0,0,.13);
    }

    .search-result-button.type-fire { background: #fee2e2; border-color: #f97316; }
    .search-result-button.type-water { background: #dbeafe; border-color: #3b82f6; }
    .search-result-button.type-grass { background: #dcfce7; border-color: #22c55e; }
    .search-result-button.type-electric { background: #fef3c7; border-color: #eab308; }
    .search-result-button.type-ice { background: #cffafe; border-color: #06b6d4; }
    .search-result-button.type-fighting { background: #ffedd5; border-color: #ea580c; }
    .search-result-button.type-poison { background: #f3e8ff; border-color: #a855f7; }
    .search-result-button.type-ground { background: #fef3c7; border-color: #d97706; }
    .search-result-button.type-flying { background: #e0e7ff; border-color: #6366f1; }
    .search-result-button.type-psychic { background: #fce7f3; border-color: #ec4899; }
    .search-result-button.type-bug { background: #ecfccb; border-color: #84cc16; }
    .search-result-button.type-rock { background: #fef9c3; border-color: #a16207; }
    .search-result-button.type-ghost { background: #ede9fe; border-color: #8b5cf6; }
    .search-result-button.type-dragon { background: #e0e7ff; border-color: #4f46e5; }
    .search-result-button.type-dark { background: #e5e7eb; border-color: #374151; }
    .search-result-button.type-steel { background: #f1f5f9; border-color: #64748b; }
    .search-result-button.type-fairy { background: #fce7f3; border-color: #ec4899; }
    .search-result-button.type-normal { background: #f3f4f6; border-color: #9ca3af; }

    .search-result-number {
        position: absolute;
        top: 16px;
        right: 18px;
        z-index: 2;
        color: rgba(23,23,23,.25);
        font-size: 14px;
        font-weight: 900;
    }

    .search-result-image {
        display: grid;
        place-items: center;
        min-height: 245px;
        padding: 20px;
    }

    .search-result-image img {
        width: min(100%, 220px);
        height: 220px;
        object-fit: contain;
        filter: drop-shadow(0 18px 18px rgba(0,0,0,.12));
    }

    .search-result-content {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: auto;
        padding: 18px 20px 22px;
        background: rgba(255,255,255,.55);
        backdrop-filter: blur(6px);
    }

    .search-result-content strong {
        font-size: 24px;
        line-height: 1;
    }

    .search-result-content .pokemon-types {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .search-modal-empty {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 40px 10px;
        color: #171717;
        text-align: center;
    }

    .search-modal-empty span {
        color: #737373;
    }

    @media (max-width: 720px) {
        .search-modal {
            padding: 12px;
        }

        .search-modal-panel {
            max-height: calc(100vh - 24px);
            padding: 18px;
            border-radius: 22px;
        }

        .search-modal-results {
            grid-auto-columns: minmax(230px, 84vw);
        }

        .search-result-button {
            min-height: 340px;
        }

        .search-result-image {
            min-height: 205px;
        }

        .search-result-image img {
            height: 185px;
        }
    }
`;

document.head.appendChild(searchModalStyles);


start();
