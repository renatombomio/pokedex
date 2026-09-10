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

        let context = window.history.state?.context || null;

        if (!context && pokemonGrid.dataset.navigationContext) {
            try {
                context = JSON.parse(pokemonGrid.dataset.navigationContext);
            } catch {
                context = null;
            }
        }

        document.dispatchEvent(
            new CustomEvent('pokemon:open-detail', {
                detail: {
                    id: pokemonId,
                    context
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

                showError();
            } finally {
                loadMoreButton.disabled = false;
                loadMoreButton.textContent = 'Cargar más Pokémon';
            }
        }
    );
}


/* ========================================
   RETRY
======================================== */

const retryButton = getRetryButton();

if (retryButton) {
    retryButton.addEventListener(
        'click',
        () => {
            start();
        }
    );
}


/* ========================================
   INIT
======================================== */

start();


/* ========================================
   HELPERS
======================================== */

function translateType(type) {
    const translations = {
        normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta',
        electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
        ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
        rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
        steel: 'Acero', fairy: 'Hada'
    };

    return translations[type] ?? type;
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatId(id) {
    return String(id).padStart(3, '0');
}

function getPokemonImage(pokemon) {
    return pokemon.sprites?.other?.['official-artwork']?.front_default
        || pokemon.sprites?.front_default
        || '';
}
