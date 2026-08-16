import {
    initializeApp,
    loadMorePokemon,
    filterByType,
    searchPokemon
} from './app.js';

import {
    loadPokemonDetails
} from './details.js';

import {
    renderPokemon,
    renderPokemonDetails,
    hidePokemonDetails,
    showLoading,
    showError,
    getRetryButton
} from './ui.js';


const searchForm =
    document.querySelector('#search-form');

const searchInput =
    document.querySelector('#search-input');

const filterButtons =
    document.querySelectorAll(
        '.filter-button'
    );

const loadMoreButton =
    document.querySelector(
        '#load-more-button'
    );

const pokemonGrid =
    document.querySelector(
        '#pokemon-grid'
    );

const detailBackButton =
    document.querySelector(
        '#detail-back'
    );


/**
 * Start the application.
 */
async function start() {

    showLoading();

    try {

        const state =
            await initializeApp();

        renderPokemon(
            state.filteredPokemon
        );

    } catch (error) {

        console.error(
            'Failed to start Pokédex:',
            error
        );

        showError();
    }
}


/**
 * Search Pokémon.
 */
searchForm.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();

        try {

            showLoading();

            const state =
                await searchPokemon(
                    searchInput.value
                );

            renderPokemon(
                state.filteredPokemon
            );

        } catch (error) {

            console.error(
                'Failed to search Pokémon:',
                error
            );

            showError();
        }
    }
);


/**
 * Filter Pokémon by type.
 */
filterButtons.forEach(
    (button) => {

        button.addEventListener(
            'click',
            async () => {

                filterButtons.forEach(
                    (item) => {

                        item.classList.remove(
                            'active'
                        );
                    }
                );

                button.classList.add(
                    'active'
                );

                try {

                    showLoading();

                    const state =
                        await filterByType(
                            button.dataset.type
                        );

                    renderPokemon(
                        state.filteredPokemon
                    );

                } catch (error) {

                    console.error(
                        'Failed to filter Pokémon:',
                        error
                    );

                    showError();
                }
            }
        );
    }
);


/**
 * Open Pokémon details.
 */
pokemonGrid.addEventListener(
    'click',
    async (event) => {

        const card =
            event.target.closest(
                '.pokemon-card'
            );

        if (!card) {
            return;
        }

        const pokemonId =
            card.dataset.pokemonId;

        console.log(
            'Opening Pokémon:',
            pokemonId
        );

        try {

            const details =
                await loadPokemonDetails(
                    pokemonId
                );

            console.log(
                'Details loaded:',
                details
            );

            renderPokemonDetails(
                details
            );

        } catch (error) {

            console.error(
                'Could not load Pokémon details:',
                error
            );
        }
    }
);


/**
 * Back to Pokédex.
 */
detailBackButton.addEventListener(
    'click',
    () => {

        hidePokemonDetails();
    }
);


/**
 * Load the next Pokémon batch.
 */
if (loadMoreButton) {

    loadMoreButton.addEventListener(
        'click',
        async () => {

            loadMoreButton.disabled =
                true;

            loadMoreButton.textContent =
                'Cargando...';

            try {

                const state =
                    await loadMorePokemon();

                renderPokemon(
                    state.filteredPokemon
                );

            } catch (error) {

                console.error(
                    'Failed to load more Pokémon:',
                    error
                );

            } finally {

                loadMoreButton.disabled =
                    false;

                loadMoreButton.textContent =
                    'Cargar más Pokémon';
            }
        }
    );
}


/**
 * Retry loading the application.
 */
getRetryButton().addEventListener(
    'click',
    start
);


/**
 * Initialize application.
 */
start();