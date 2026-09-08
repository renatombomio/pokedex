import {
    getEvolutionTree
} from './details.js';

import {
    isFavorite
} from './favorites.js';


const detailContent = document.querySelector('#detail-content');
const MAX_BASE_STAT = 255;


/**
 * Render the complete Gamedex view directly from the detail state.
 */
export function renderGamedex(details) {
    if (!detailContent || !details?.pokemon || !details?.species) {
        return;
    }

    const { pokemon, species } = details;
    const primaryType = pokemon.types?.[0]?.type.name ?? 'normal';
    const types = pokemon.types
        .map(({ type }) => `
            <span class="pokemon-type type-${type.name}">
                ${translateType(type.name)}
            </span>
        `)
        .join('');

    const evolutionTree = getEvolutionTree();
    const evolutionSection = evolutionTree?.children.length || evolutionTree?.pokemon
        ? createEvolutionSection(evolutionTree)
        : '';

    const favorite = isFavorite(pokemon.id);

    detailContent.innerHTML = `
        <article class="gamedex-card type-${primaryType}">
            <header class="gamedex-header">
                <div class="gamedex-title">
                    <h1>${escapeHtml(capitalize(pokemon.name))}</h1>
                    <div class="gamedex-types">${types}</div>
                </div>
                <span class="gamedex-number">#${formatId(pokemon.id)}</span>
            </header>

            <div class="gamedex-artwork" aria-hidden="true">
                <div class="gamedex-orbit gamedex-orbit-back"></div>
                <div class="gamedex-orbit gamedex-orbit-front"></div>
                <img
                    src="${escapeAttribute(getPokemonImage(pokemon))}"
                    alt=""
                >
            </div>

            <div class="gamedex-meta" aria-label="Información principal">
                ${createMetaItem('Altura', formatHeight(pokemon.height))}
                ${createMetaItem('Peso', formatWeight(pokemon.weight))}
                <div class="gamedex-meta-item gamedex-ability">
                    <span>Habilidad</span>
                    <strong>${escapeHtml(getPrimaryAbility(pokemon))}</strong>
                </div>
                <button
                    class="favorite-toggle${favorite ? ' is-favorite' : ''}"
                    type="button"
                    data-pokemon-id="${pokemon.id}"
                    aria-pressed="${favorite}"
                    aria-label="${favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}"
                    title="${favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}"
                >
                    <span aria-hidden="true">♥</span>
                </button>
            </div>

            <div class="gamedex-stats" aria-label="Estadísticas base">
                ${pokemon.stats.map(createStat).join('')}
            </div>
        </article>

        <section class="pokemon-about">
            <div class="pokemon-about-header">
                <span>Pokédex</span>
                <h2>Sobre ${escapeHtml(capitalize(pokemon.name))}</h2>
            </div>
            <p>${escapeHtml(getDescription(species))}</p>
        </section>

        ${evolutionSection}
    `;
}


/**
 * Hide Gamedex.
 */
export function hideGamedex() {
    const detailSection = document.querySelector('#pokemon-detail');
    detailSection?.classList.add('hidden');
    detailSection?.setAttribute('aria-hidden', 'true');
}


function createMetaItem(label, value) {
    return `
        <div class="gamedex-meta-item">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
        </div>
    `;
}


function createStat(stat) {
    const labels = {
        hp: 'PS',
        attack: 'ATQ',
        defense: 'DEF',
        'special-attack': 'ATQ ESP',
        'special-defense': 'DEF ESP',
        speed: 'VEL'
    };

    const value = Math.max(0, Number(stat.base_stat) || 0);
    const width = Math.min(value / MAX_BASE_STAT * 100, 100);
    const label = labels[stat.stat.name] ?? stat.stat.name;

    return `
        <div class="gamedex-stat">
            <div class="gamedex-stat-top">
                <span>${escapeHtml(label)}</span>
                <strong>${value}</strong>
            </div>
            <div class="gamedex-stat-track">
                <span style="width:${width}%"></span>
            </div>
        </div>
    `;
}


function createEvolutionSection(tree) {
    if (!tree) {
        return '';
    }

    const rootCard = createEvolutionCard(tree.pokemon);
    const children = tree.children ?? [];

    if (children.length === 0) {
        return `
            <section class="evolution-section">
                <span class="panel-eyebrow">Evoluciones</span>
                <h2>Cadena evolutiva</h2>
                <div class="evolution-chain evolution-chain-single">
                    ${rootCard}
                </div>
            </section>
        `;
    }

    if (children.length === 1) {
        return `
            <section class="evolution-section">
                <span class="panel-eyebrow">Evoluciones</span>
                <h2>Cadena evolutiva</h2>
                <div class="evolution-chain evolution-chain-linear">
                    ${rootCard}
                    <span class="evolution-arrow" aria-hidden="true"></span>
                    ${createLinearDescendant(children[0])}
                </div>
            </section>
        `;
    }

    return `
        <section class="evolution-section evolution-section-branching">
            <span class="panel-eyebrow">Evoluciones</span>
            <h2>Cadena evolutiva</h2>
            <div class="evolution-tree">
                <div class="evolution-tree-root">
                    ${rootCard}
                </div>
                <div class="evolution-tree-connector" aria-hidden="true"></div>
                <div class="evolution-tree-branches">
                    ${children.map((child) => `
                        <div class="evolution-branch">
                            <span class="evolution-arrow" aria-hidden="true"></span>
                            ${createLinearDescendant(child)}
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
}


function createLinearDescendant(node) {
    const cards = [createEvolutionCard(node.pokemon)];
    let current = node;

    while (current.children?.length === 1) {
        cards.push('<span class="evolution-arrow" aria-hidden="true"></span>');
        current = current.children[0];
        cards.push(createEvolutionCard(current.pokemon));
    }

    if (current.children?.length > 1) {
        cards.push(`
            <div class="evolution-subbranches">
                ${current.children.map((child) => `
                    <div class="evolution-branch">
                        <span class="evolution-arrow" aria-hidden="true"></span>
                        ${createLinearDescendant(child)}
                    </div>
                `).join('')}
            </div>
        `);
    }

    return cards.join('');
}


function createEvolutionCard(pokemon) {
    return `
        <article class="evolution-card" data-pokemon-id="${pokemon.id}">
            <button
                class="evolution-card-button"
                type="button"
                data-pokemon-id="${pokemon.id}"
                aria-label="Ver ${escapeHtml(capitalize(pokemon.name))}"
            >
                <span class="evolution-number">#${formatId(pokemon.id)}</span>
                <img
                    src="${escapeAttribute(getEvolutionImage(pokemon.id))}"
                    alt="${escapeHtml(capitalize(pokemon.name))}"
                    loading="lazy"
                >
                <strong>${escapeHtml(capitalize(pokemon.name))}</strong>
            </button>
        </article>
    `;
}


function getEvolutionImage(id) {
    if (!id) {
        return '';
    }

    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}


function getPokemonImage(pokemon) {
    return (
        pokemon.sprites?.other?.['official-artwork']?.front_default ||
        pokemon.sprites?.front_default ||
        ''
    );
}


function getPrimaryAbility(pokemon) {
    const ability = pokemon.abilities?.find(({ is_hidden }) => !is_hidden)?.ability?.name;
    return ability ? translateAbility(ability) : '—';
}


function getDescription(species) {
    const entry = species.flavor_text_entries?.find(
        ({ language }) => language.name === 'es'
    );

    if (!entry) {
        return 'No hay descripción disponible.';
    }

    return entry.flavor_text
        .replace(/\f/g, ' ')
        .replace(/\n/g, ' ');
}


function formatHeight(height) {
    return `${(height / 10).toFixed(1)} m`;
}


function formatWeight(weight) {
    return `${(weight / 10).toFixed(1)} kg`;
}


function translateType(type) {
    const translations = {
        normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
        grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
        ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
        rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
        steel: 'Acero', fairy: 'Hada'
    };

    return translations[type] ?? capitalize(type);
}


function translateAbility(ability) {
    const translations = {
        overgrow: 'Espesura',
        blaze: 'Mar Llamas',
        torrent: 'Torrente',
        shield_dust: 'Polvo Escudo',
        static: 'Electricidad Estática'
    };

    return translations[ability] ?? capitalize(ability.replace('-', ' '));
}


function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}


function formatId(id) {
    return String(id).padStart(3, '0');
}


function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


function escapeAttribute(value) {
    return escapeHtml(value);
}
