const elements = {
    grid: document.querySelector('#pokemon-grid'),
    count: document.querySelector('#pokemon-count'),

    loading: document.querySelector('#loading-state'),
    error: document.querySelector('#error-state'),
    empty: document.querySelector('#empty-state'),

    retry: document.querySelector('#retry-button')
};


/**
 * Render the current Pokémon collection.
 */
export function renderPokemon(pokemon) {

    hideAllStates();

    elements.count.textContent =
        pokemon.length;

    if (pokemon.length === 0) {

        elements.empty.classList.remove(
            'hidden'
        );

        return;
    }

    const fragment =
        document.createDocumentFragment();

    pokemon.forEach((entry) => {

        fragment.appendChild(
            createPokemonCard(entry)
        );

    });

    elements.grid.replaceChildren(
        fragment
    );
}


/**
 * Show loading state.
 */
export function showLoading() {

    elements.grid.replaceChildren();

    hideAllStates();

    elements.loading.classList.remove(
        'hidden'
    );
}


/**
 * Show error state.
 */
export function showError() {

    elements.grid.replaceChildren();

    hideAllStates();

    elements.error.classList.remove(
        'hidden'
    );
}


/**
 * Return the retry button.
 */
export function getRetryButton() {

    return elements.retry;
}


/**
 * Create a Pokémon card.
 */
function createPokemonCard(pokemon) {

    const article =
        document.createElement('article');

    article.className =
        'pokemon-card';

    article.dataset.pokemonId =
        pokemon.id;


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
            class="pokemon-card-button"
            type="button"
            data-pokemon-id="${pokemon.id}"
            aria-label="Ver ${capitalize(
                pokemon.name
            )}"
        >

            <div class="pokemon-card-image">

                <span class="pokemon-number">
                    #${formatId(pokemon.id)}
                </span>

                <img
                    src="${getPokemonImage(pokemon)}"
                    alt="${capitalize(
                        pokemon.name
                    )}"
                    loading="lazy"
                >

            </div>


            <div class="pokemon-card-content">

                <h3>
                    ${capitalize(
                        pokemon.name
                    )}
                </h3>

                <div class="pokemon-types">
                    ${types}
                </div>

            </div>

        </button>
    `;


    return article;
}


/**
 * Get the best available Pokémon artwork.
 */
function getPokemonImage(pokemon) {

    return (
        pokemon.sprites
            ?.other
            ?.['official-artwork']
            ?.front_default
        ??
        pokemon.sprites?.front_default
        ??
        ''
    );
}


/**
 * Translate PokéAPI type names.
 */
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

    return (
        translations[type]
        ??
        capitalize(type)
    );
}


/**
 * Capitalize Pokémon names.
 */
function capitalize(value) {

    return (
        value.charAt(0).toUpperCase()
        +
        value.slice(1)
    );
}


/**
 * Format Pokédex number.
 */
function formatId(id) {

    return String(id)
        .padStart(3, '0');
}


/**
 * Hide every application state.
 */
function hideAllStates() {

    elements.loading.classList.add(
        'hidden'
    );

    elements.error.classList.add(
        'hidden'
    );

    elements.empty.classList.add(
        'hidden'
    );
}


/**
 * Render Pokémon detail view.
 */
export function renderPokemonDetails(details) {

    const detailSection =
        document.querySelector(
            '#pokemon-detail'
        );

    const detailContent =
        document.querySelector(
            '#detail-content'
        );

    const heroSection =
        document.querySelector('.hero');

    const pokedexSection =
        document.querySelector('#pokedex');

    const favoritesSection =
        document.querySelector('#favorites');


    const {
        pokemon,
        species,
        evolution
    } = details;


    const primaryType =
        pokemon.types[0]?.type.name
        ??
        'normal';


    const types =
        pokemon.types
            .map(({ type }) => `
                <span class="pokemon-type type-${type.name}">
                    ${translateType(type.name)}
                </span>
            `)
            .join('');


    const stats =
        pokemon.stats
            .map(({ stat, base_stat }) => `

                <div class="stat-row">

                    <div class="stat-header">

                        <span>
                            ${translateStat(
                                stat.name
                            )}
                        </span>

                        <strong>
                            ${base_stat}
                        </strong>

                    </div>


                    <div
                        class="stat-bar type-${primaryType}"
                    >

                        <span
                            style="width: ${Math.min(
                                base_stat,
                                100
                            )}%"
                        ></span>

                    </div>

                </div>

            `)
            .join('');


    const abilities =
        pokemon.abilities
            .map(({ ability }) => `

                <span class="ability">
                    ${translateAbility(
                        ability.name
                    )}
                </span>

            `)
            .join('');


    /*
     * Build evolution section.
     */
    const evolutionList =
        getEvolutionList(
            evolution
        );


    const evolutionSection =
        evolutionList.length > 1
            ? createEvolutionSection(
                evolutionList
            )
            : '';


    detailContent.innerHTML = `

        <!-- ========================================
             MAIN POKÉMON CARD
        ======================================== -->

        <div class="detail-hero">

            <div class="detail-number">
                #${formatId(pokemon.id)}
            </div>


            <div class="detail-heading">

                <span class="detail-eyebrow">
                    ${translateGeneration(
                        species.generation.name
                    )}
                </span>


                <h1>
                    ${capitalize(
                        pokemon.name
                    )}
                </h1>


                <div class="pokemon-types">
                    ${types}
                </div>

            </div>


            <div class="detail-image">

                <img
                    src="${getPokemonImage(
                        pokemon
                    )}"
                    alt="${capitalize(
                        pokemon.name
                    )}"
                >

            </div>

        </div>


        <!-- ========================================
             INFORMATION / ABILITIES / STATS
        ======================================== -->

        <div class="detail-grid">


            <!-- INFORMATION -->

            <section class="detail-panel">

                <span class="panel-eyebrow">
                    Información
                </span>


                <h2>
                    ${capitalize(
                        pokemon.name
                    )}
                </h2>


                <div class="physical-data">

                    <div>

                        <span>
                            Altura
                        </span>

                        <strong>
                            ${formatHeight(
                                pokemon.height
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Peso
                        </span>

                        <strong>
                            ${formatWeight(
                                pokemon.weight
                            )}
                        </strong>

                    </div>

                </div>


                <p class="pokemon-description">
                    ${getDescription(
                        species
                    )}
                </p>

            </section>


            <!-- ABILITIES -->

            <section class="detail-panel">

                <span class="panel-eyebrow">
                    Habilidades
                </span>


                <h2>
                    Habilidades
                </h2>


                <div class="abilities">
                    ${abilities}
                </div>

            </section>


            <!-- STATISTICS -->

            <section class="detail-panel">

                <span class="panel-eyebrow">
                    Estadísticas
                </span>


                <h2>
                    Estadísticas base
                </h2>


                <div class="stats">
                    ${stats}
                </div>

            </section>

        </div>


        ${evolutionSection}

    `;


    /*
     * Switch from the Pokédex to
     * the selected Pokémon detail.
     */

    heroSection?.classList.add(
        'hidden'
    );

    pokedexSection?.classList.add(
        'hidden'
    );

    favoritesSection?.classList.add(
        'hidden'
    );


    detailSection.classList.remove(
        'hidden'
    );

    detailSection.setAttribute(
        'aria-hidden',
        'false'
    );


    window.scrollTo({

        top: 0,

        behavior: 'smooth'

    });
}


/**
 * Build the evolution section.
 */
function createEvolutionSection(
    evolutionList
) {

    const cards =
        evolutionList
            .map(
                (evolution, index) => {

                    const image =
                        getEvolutionImage(
                            evolution.id
                        );


                    const arrow =
                        index <
                        evolutionList.length - 1
                            ? `
                                <span
                                    class="evolution-arrow"
                                    aria-hidden="true"
                                >
                                    →
                                </span>
                              `
                            : '';


                    return `

                        <article
                            class="evolution-card pokemon-card"
                            data-pokemon-id="${evolution.id}"
                        >

                            <button
                                class="evolution-card-button"
                                type="button"
                                data-pokemon-id="${evolution.id}"
                                aria-label="Ver ${capitalize(
                                    evolution.name
                                )}"
                            >

                                <span
                                    class="evolution-number"
                                >
                                    #${formatId(
                                        evolution.id
                                    )}
                                </span>


                                <img
                                    src="${image}"
                                    alt="${capitalize(
                                        evolution.name
                                    )}"
                                    loading="lazy"
                                >


                                <strong>
                                    ${capitalize(
                                        evolution.name
                                    )}
                                </strong>

                            </button>

                        </article>

                        ${arrow}

                    `;
                }
            )
            .join('');


    return `

        <section class="evolution-section">

            <span class="panel-eyebrow">
                Evoluciones
            </span>


            <h2>
                Cadena evolutiva
            </h2>


            <div class="evolution-chain">

                ${cards}

            </div>

        </section>

    `;
}


/**
 * Flatten the recursive PokéAPI
 * evolution chain.
 */
function getEvolutionList(
    evolution
) {

    if (
        !evolution ||
        !evolution.chain
    ) {
        return [];
    }


    const list = [];


    function walk(chain) {

        if (!chain) {
            return;
        }


        if (chain.species) {

            const id =
                getIdFromUrl(
                    chain.species.url
                );


            list.push({

                id,

                name:
                    chain.species.name,

                url:
                    chain.species.url

            });
        }


        if (
            chain.evolves_to &&
            chain.evolves_to.length
        ) {

            chain.evolves_to.forEach(
                (next) => {

                    walk(next);

                }
            );
        }
    }


    walk(
        evolution.chain
    );


    return list;
}


/**
 * Extract a Pokédex ID from
 * a PokéAPI resource URL.
 */
function getIdFromUrl(url) {

    if (!url) {
        return null;
    }


    const parts =
        url
            .split('/')
            .filter(Boolean);


    return Number(
        parts[parts.length - 1]
    );
}


/**
 * Get official artwork for
 * an evolution Pokémon.
 */
function getEvolutionImage(id) {

    if (!id) {
        return '';
    }


    return `
        https://raw.githubusercontent.com/
        PokeAPI/sprites/master/sprites/pokemon/
        other/official-artwork/${id}.png
    `.replace(/\s+/g, '');
}


/**
 * Hide Pokémon detail view.
 */
export function hidePokemonDetails() {

    const detailSection =
        document.querySelector(
            '#pokemon-detail'
        );

    const heroSection =
        document.querySelector('.hero');

    const pokedexSection =
        document.querySelector('#pokedex');

    const favoritesSection =
        document.querySelector('#favorites');


    detailSection.classList.add(
        'hidden'
    );

    detailSection.setAttribute(
        'aria-hidden',
        'true'
    );


    heroSection?.classList.remove(
        'hidden'
    );

    pokedexSection?.classList.remove(
        'hidden'
    );

    favoritesSection?.classList.remove(
        'hidden'
    );


    window.scrollTo({

        top: 0,

        behavior: 'smooth'

    });
}


/**
 * Translate stat names.
 */
function translateStat(stat) {

    const translations = {

        hp: 'PS',

        attack: 'Ataque',

        defense: 'Defensa',

        'special-attack':
            'At. Especial',

        'special-defense':
            'Def. Especial',

        speed: 'Velocidad'

    };


    return (
        translations[stat]
        ??
        capitalize(stat)
    );
}


/**
 * Translate ability names.
 */
function translateAbility(
    ability
) {

    const translations = {

        overgrow: 'Espesura',

        blaze: 'Mar Llamas',

        torrent: 'Torrente',

        shield_dust:
            'Polvo Escudo',

        static:
            'Electricidad Estática'

    };


    return (
        translations[ability]
        ??
        capitalize(
            ability.replace(
                '-',
                ' '
            )
        )
    );
}


/**
 * Translate generation names.
 */
function translateGeneration(
    generation
) {

    const generations = {

        'generation-i':
            'Kanto',

        'generation-ii':
            'Johto',

        'generation-iii':
            'Hoenn',

        'generation-iv':
            'Sinnoh',

        'generation-v':
            'Teselia',

        'generation-vi':
            'Kalos',

        'generation-vii':
            'Alola',

        'generation-viii':
            'Galar',

        'generation-ix':
            'Paldea'

    };


    return (
        generations[generation]
        ??
        capitalize(generation)
    );
}


/**
 * Get Spanish Pokémon description.
 */
function getDescription(
    species
) {

    const entry =
        species.flavor_text_entries.find(
            ({ language }) =>
                language.name === 'es'
        );


    if (!entry) {

        return (
            'No hay descripción disponible.'
        );
    }


    return entry.flavor_text
        .replace(/\f/g, ' ')
        .replace(/\n/g, ' ');
}


/**
 * Format height.
 */
function formatHeight(height) {

    return `${
        (height / 10).toFixed(1)
    } m`;
}


/**
 * Format weight.
 */
function formatWeight(weight) {

    return `${
        (weight / 10).toFixed(1)
    } kg`;
}