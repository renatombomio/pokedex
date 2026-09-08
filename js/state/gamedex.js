import {
    getEvolutionList
} from './details.js';


const detailContent = document.querySelector('#detail-content');


/**
 * Render the complete Gamedex view directly from the detail state.
 * No intermediate detail DOM or MutationObserver is required.
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

    const evolutionList = getEvolutionList();
    const evolutionSection = evolutionList.length > 1
        ? createEvolutionSection(evolutionList)
        : '';

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

    showDetailView();
}


/**
 * Hide Gamedex and restore the main Pokédex view.
 */
export function hideGamedex() {
    const detailSection = document.querySelector('#pokemon-detail');
    const heroSection = document.querySelector('.hero');
    const pokedexSection = document.querySelector('#pokedex');
    const favoritesSection = document.querySelector('#favorites');

    detailSection?.classList.add('hidden');
    detailSection?.setAttribute('aria-hidden', 'true');
    heroSection?.classList.remove('hidden');
    pokedexSection?.classList.remove('hidden');
    favoritesSection?.classList.remove('hidden');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


function showDetailView() {
    const detailSection = document.querySelector('#pokemon-detail');
    const heroSection = document.querySelector('.hero');
    const pokedexSection = document.querySelector('#pokedex');
    const favoritesSection = document.querySelector('#favorites');

    heroSection?.classList.add('hidden');
    pokedexSection?.classList.add('hidden');
    favoritesSection?.classList.add('hidden');
    detailSection?.classList.remove('hidden');
    detailSection?.setAttribute('aria-hidden', 'false');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
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
    const label = translateStat(stat.stat.name);
    const shortLabel = {
        PS: 'PS',
        Ataque: 'ATQ',
        Defensa: 'DEF',
        'At. Especial': 'ATQ ESP',
        'Def. Especial': 'DEF ESP',
        Velocidad: 'VEL'
    }[label] ?? label.slice(0, 7).toUpperCase();

    const value = Number(stat.base_stat) || 0;
    const width = Math.min(value, 100);

    return `
        <div class="gamedex-stat">
            <div class="gamedex-stat-top">
                <span>${escapeHtml(shortLabel)}</span>
                <strong>${value}</strong>
            </div>
            <div class="gamedex-stat-track">
                <span style="width:${width}%"></span>
            </div>
        </div>
    `;
}


function createEvolutionSection(evolutionList) {
    const cards = evolutionList
        .map((evolution, index) => {
            const arrow = index < evolutionList.length - 1
                ? '<span class="evolution-arrow" aria-hidden="true"></span>'
                : '';

            return `
                <article
                    class="evolution-card"
                    data-pokemon-id="${evolution.id}"
                >
                    <button
                        class="evolution-card-button"
                        type="button"
                        data-pokemon-id="${evolution.id}"
                        aria-label="Ver ${escapeHtml(capitalize(evolution.name))}"
                    >
                        <span class="evolution-number">
                            #${formatId(evolution.id)}
                        </span>
                        <img
                            src="${escapeAttribute(getEvolutionImage(evolution.id))}"
                            alt="${escapeHtml(capitalize(evolution.name))}"
                            loading="lazy"
                        >
                        <strong>${escapeHtml(capitalize(evolution.name))}</strong>
                    </button>
                </article>
                ${arrow}
            `;
        })
        .join('');

    return `
        <section class="evolution-section">
            <span class="panel-eyebrow">Evoluciones</span>
            <h2>Cadena evolutiva</h2>
            <div class="evolution-chain">
                ${cards}
            </div>
        </section>
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


function translateStat(stat) {
    const translations = {
        hp: 'PS',
        attack: 'Ataque',
        defense: 'Defensa',
        'special-attack': 'At. Especial',
        'special-defense': 'Def. Especial',
        speed: 'Velocidad'
    };

    return translations[stat] ?? capitalize(stat);
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
