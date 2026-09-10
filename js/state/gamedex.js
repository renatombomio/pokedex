import { getEvolutionTree } from './details.js';
import { getPokemon } from '../api/pokemon.js';

const detailContent = document.querySelector('#detail-content');
const MAX_BASE_STAT = 255;
const AUDIO_PREFERENCE_KEY = 'pokedex-gamedex-audio';
const ANIMATION_PREFERENCE_KEY = 'pokedex-gamedex-animated';

let currentPokemon = null;
let currentDetails = null;
let currentImageMode = 'animated';
let currentShiny = false;
let formRequestId = 0;

export function renderGamedex(details) {
    if (!detailContent || !details?.pokemon || !details?.species) return;

    currentDetails = details;
    currentPokemon = details.pokemon;
    currentShiny = false;
    currentImageMode = getStoredBoolean(ANIMATION_PREFERENCE_KEY, true) ? 'animated' : 'static';

    renderCurrentGamedex();
    if (getStoredBoolean(AUDIO_PREFERENCE_KEY, true)) scheduleCry(currentPokemon);
}

function renderCurrentGamedex() {
    if (!detailContent || !currentPokemon || !currentDetails?.species) return;

    const pokemon = currentPokemon;
    const species = currentDetails.species;
    const primaryType = pokemon.types?.[0]?.type.name ?? 'normal';
    const types = (pokemon.types ?? []).map(({ type }) => `
        <span class="pokemon-type type-${type.name}">${translateType(type.name)}</span>
    `).join('');
    const evolutionTree = getEvolutionTree();
    const evolutionSection = evolutionTree?.children?.length ? createEvolutionSection(evolutionTree) : '';
    const shinyAvailable = Boolean(getShinyImage(pokemon));
    const animatedAvailable = Boolean(getAnimatedImage(pokemon, currentShiny));
    const audioEnabled = getStoredBoolean(AUDIO_PREFERENCE_KEY, true);

    detailContent.innerHTML = `
        <article class="gamedex-card type-${primaryType}">
            <div class="gamedex-media-tools" aria-label="Controles multimedia">
                <button class="gamedex-media-button" type="button" data-gamedex-animation aria-pressed="${currentImageMode === 'animated'}" title="${currentImageMode === 'animated' ? 'Mostrar imagen estática' : 'Mostrar sprite animado'}">
                    ${currentImageMode === 'animated' && animatedAvailable ? 'GIF' : 'IMG'}
                </button>
                ${shinyAvailable ? `
                    <button class="gamedex-media-button" type="button" data-gamedex-shiny aria-pressed="${currentShiny}" title="Cambiar entre normal y shiny">
                        ${currentShiny ? 'NORMAL' : 'SHINY'}
                    </button>
                ` : ''}
                <button class="gamedex-media-button" type="button" data-gamedex-audio aria-pressed="${audioEnabled}" title="${audioEnabled ? 'Desactivar sonidos' : 'Activar sonidos'}">
                    ${audioEnabled ? '♫' : '♪'}
                </button>
            </div>

            <header class="gamedex-header">
                <div class="gamedex-title">
                    <h1>${escapeHtml(displayPokemonName(pokemon))}</h1>
                    <div class="gamedex-types">${types}</div>
                </div>
                <span class="gamedex-number">#${formatId(pokemon.id)}</span>
            </header>

            <div class="gamedex-artwork" aria-label="Ilustración de ${escapeAttribute(displayPokemonName(pokemon))}">
                <div class="gamedex-orbit gamedex-orbit-back" aria-hidden="true"></div>
                <div class="gamedex-orbit gamedex-orbit-front" aria-hidden="true"></div>
                <img
                    class="${currentShiny ? 'is-shiny' : ''} ${currentImageMode === 'animated' && animatedAvailable ? 'is-animated' : ''}"
                    src="${escapeAttribute(getCurrentImage(pokemon))}"
                    alt="${escapeAttribute(displayPokemonName(pokemon))}"
                    decoding="async"
                >
            </div>

            ${createFormSelector(species, pokemon)}
            ${createSpeciesBadges(species)}

            <div class="gamedex-meta" aria-label="Información principal">
                ${createMetaItem('Altura', formatHeight(pokemon.height))}
                ${createMetaItem('Peso', formatWeight(pokemon.weight))}
                <div class="gamedex-meta-item gamedex-ability">
                    <span>Habilidad</span>
                    <strong>${escapeHtml(getPrimaryAbility(pokemon))}</strong>
                </div>
                <button class="gamedex-capture-launch" type="button" data-gamedex-capture aria-label="Capturar ${escapeAttribute(displayPokemonName(pokemon))}" title="Capturar Pokémon">
                    <span class="gamedex-capture-launch-ball" aria-hidden="true"></span>
                </button>
            </div>

            <div class="gamedex-stats" aria-label="Estadísticas base">
                ${(pokemon.stats ?? []).map(createStat).join('')}
            </div>
        </article>

        <section class="pokemon-about">
            <div class="pokemon-about-header">
                <span>Pokédex</span>
                <h2>Sobre ${escapeHtml(displayPokemonName(pokemon))}</h2>
            </div>
            <p>${escapeHtml(getDescription(species))}</p>
        </section>

        ${createSpeciesSection(species)}
        ${evolutionSection}
    `;
}

function createFormSelector(species, pokemon) {
    const varieties = species.varieties ?? [];
    if (varieties.length <= 1) return '';

    const options = varieties.map(({ is_default, pokemon: variant }) => `
        <option value="${escapeAttribute(variant.name)}" ${variant.name === pokemon.name ? 'selected' : ''}>
            ${escapeHtml(formatVariantName(variant.name, is_default))}
        </option>
    `).join('');

    return `
        <div class="gamedex-form-controls">
            <label class="gamedex-form-label" for="gamedex-form-select">Forma</label>
            <select class="gamedex-form-select" id="gamedex-form-select" data-gamedex-form>
                ${options}
            </select>
        </div>
    `;
}

function createSpeciesBadges(species) {
    const badges = [];
    if (species.is_legendary) badges.push('<span class="gamedex-badge gamedex-badge-legendary">Legendario</span>');
    if (species.is_mythical) badges.push('<span class="gamedex-badge gamedex-badge-mythical">Singular</span>');
    return badges.length ? `<div class="gamedex-badges">${badges.join('')}</div>` : '';
}

function createSpeciesSection(species) {
    const habitat = species.habitat?.name ? translateHabitat(species.habitat.name) : 'Desconocido';
    const generation = species.generation?.name ? formatGeneration(species.generation.name) : '—';
    const genus = species.genera?.find(({ language }) => language.name === 'es')?.genus ?? 'Pokémon';
    const varieties = species.varieties ?? [];

    return `
        <section class="gamedex-species">
            <div class="gamedex-species-header">
                <span>Ficha de especie</span>
                <h2>Información de especie</h2>
            </div>
            <div class="gamedex-species-grid">
                ${createSpeciesItem('Hábitat', habitat)}
                ${createSpeciesItem('Generación', generation)}
                ${createSpeciesItem('Especie', genus)}
            </div>
            ${varieties.length > 1 ? `
                <div class="gamedex-forms">
                    <span class="gamedex-forms-title">Formas disponibles</span>
                    <div class="gamedex-forms-list">
                        ${varieties.map(({ is_default, pokemon: variant }) => `
                            <button
                                class="gamedex-form-chip ${variant.name === currentPokemon.name ? 'is-current' : ''}"
                                type="button"
                                data-gamedex-form-chip="${escapeAttribute(variant.name)}"
                            >
                                ${escapeHtml(formatVariantName(variant.name, is_default))}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </section>
    `;
}

function createSpeciesItem(label, value) {
    return `<div class="gamedex-species-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function createMetaItem(label, value) {
    return `<div class="gamedex-meta-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
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
    const width = Math.min((value / MAX_BASE_STAT) * 100, 100);
    const label = labels[stat.stat.name] ?? stat.stat.name;

    return `
        <div class="gamedex-stat">
            <div class="gamedex-stat-top">
                <span>${escapeHtml(label)}</span>
                <strong>${value}</strong>
            </div>
            <div class="gamedex-stat-track"><span style="width:${width}%"></span></div>
        </div>
    `;
}

function createEvolutionSection(tree) {
    if (!tree?.children?.length) return '';

    const rootCard = createEvolutionCard(tree.pokemon, []);

    if (tree.children.length === 1) {
        return `
            <section class="evolution-section">
                <span class="panel-eyebrow">Evoluciones</span>
                <h2>Cadena evolutiva</h2>
                <div class="evolution-chain evolution-chain-linear">
                    ${rootCard}
                    <span class="evolution-arrow" aria-hidden="true"></span>
                    ${createLinearDescendant(tree.children[0])}
                </div>
            </section>
        `;
    }

    return `
        <section class="evolution-section evolution-section-branching">
            <span class="panel-eyebrow">Evoluciones</span>
            <h2>Cadena evolutiva</h2>
            <div class="evolution-tree">
                <div class="evolution-tree-root">${rootCard}</div>
                <div class="evolution-tree-connector" aria-hidden="true"></div>
                <div class="evolution-tree-branches">
                    ${tree.children.map((child) => `
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
    const cards = [createEvolutionCard(node.pokemon, node.evolutionDetails)];
    let current = node;

    while (current.children?.length === 1) {
        cards.push('<span class="evolution-arrow" aria-hidden="true"></span>');
        current = current.children[0];
        cards.push(createEvolutionCard(current.pokemon, current.evolutionDetails));
    }

    if (current.children?.length > 1) {
        cards.push(`
            <div class="evolution-subbranches">
                ${current.children.map((child) => `
                    <div class="evolution-subbranch">
                        <span class="evolution-arrow" aria-hidden="true"></span>
                        ${createLinearDescendant(child)}
                    </div>
                `).join('')}
            </div>
        `);
    }

    return cards.join('');
}

function createEvolutionCard(pokemon, evolutionDetails) {
    const id = pokemon?.id;
    const name = displayPokemonName(pokemon);
    const image = getEvolutionImage(pokemon);
    const conditions = formatEvolutionConditions(evolutionDetails);

    return `
        <button class="evolution-card-button" type="button" data-evolution-pokemon-id="${id}" aria-label="Ver ${escapeAttribute(name)}">
            <span class="evolution-card-image"><img src="${escapeAttribute(image)}" alt="${escapeAttribute(name)}" loading="lazy"></span>
            <span class="evolution-card-number">#${formatId(id)}</span>
            <strong>${escapeHtml(name)}</strong>
            ${conditions ? `<span class="evolution-card-condition">${escapeHtml(conditions)}</span>` : ''}
        </button>
    `;
}

function formatEvolutionConditions(details = []) {
    if (!details.length) return '';
    return details.map((detail) => {
        if (detail.trigger?.name === 'level-up') {
            if (detail.min_level) return `Nivel ${detail.min_level}`;
            if (detail.time_of_day) return detail.time_of_day === 'day' ? 'De día' : 'De noche';
            if (detail.known_move) return `Con ${formatMoveName(detail.known_move.name)}`;
            if (detail.held_item) return `Con ${formatItemName(detail.held_item.name)}`;
            return 'Al subir de nivel';
        }
        if (detail.trigger?.name === 'use-item') return `Usando ${formatItemName(detail.item?.name)}`;
        if (detail.trigger?.name === 'trade') return 'Intercambio';
        if (detail.trigger?.name === 'shed') return 'Al evolucionar';
        if (detail.trigger?.name === 'spin') return 'Al girar';
        if (detail.trigger?.name === 'tower-of-darkness') return 'Torre de la Oscuridad';
        if (detail.trigger?.name === 'tower-of-waters') return 'Torre de las Aguas';
        return detail.trigger?.name ? formatMoveName(detail.trigger.name) : '';
    }).filter(Boolean).join(' · ');
}

function getEvolutionImage(pokemon) {
    return pokemon?.sprites?.other?.['official-artwork']?.front_default
        || pokemon?.sprites?.front_default
        || '';
}

function getCurrentImage(pokemon) {
    if (currentShiny) {
        if (currentImageMode === 'animated') {
            return getAnimatedImage(pokemon, true)
                || getShinyImage(pokemon)
                || getStaticImage(pokemon, true);
        }
        return getShinyImage(pokemon) || getStaticImage(pokemon, true);
    }
    if (currentImageMode === 'animated') {
        return getAnimatedImage(pokemon, false)
            || getStaticImage(pokemon, false);
    }
    return getStaticImage(pokemon, false);
}

function getAnimatedImage(pokemon, shiny) {
    const sprites = pokemon.sprites ?? {};
    const animated = sprites.versions?.['generation-v']?.['black-white']?.animated;
    return shiny ? animated?.front_shiny ?? '' : animated?.front_default ?? '';
}

function getShinyImage(pokemon) {
    return pokemon.sprites?.front_shiny
        || pokemon.sprites?.other?.['official-artwork']?.front_shiny
        || '';
}

function getStaticImage(pokemon, shiny = false) {
    return shiny
        ? getShinyImage(pokemon)
        : pokemon.sprites?.other?.['official-artwork']?.front_default
            || pokemon.sprites?.front_default
            || '';
}

function displayPokemonName(pokemon) {
    return pokemon?.name ? pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1) : 'Pokémon';
}

function getPrimaryAbility(pokemon) {
    return pokemon.abilities?.[0]?.ability?.name
        ? formatMoveName(pokemon.abilities[0].ability.name)
        : 'Desconocida';
}

function formatHeight(height) {
    return `${(Number(height) / 10).toFixed(1)} m`;
}

function formatWeight(weight) {
    return `${(Number(weight) / 10).toFixed(1)} kg`;
}

function formatId(id) {
    return String(id).padStart(3, '0');
}

function formatGeneration(value) {
    const generation = value.replace('generation-', '');
    const map = { i: 'I', ii: 'II', iii: 'III', iv: 'IV', v: 'V', vi: 'VI', vii: 'VII', viii: 'VIII', ix: 'IX' };
    return `Gen. ${map[generation] ?? generation.toUpperCase()}`;
}

function translateType(type) {
    const translations = {
        normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta',
        ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
        psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
        dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
    };
    return translations[type] ?? type;
}

function translateHabitat(habitat) {
    const translations = {
        cave: 'Cueva', forest: 'Bosque', grassland: 'Pradera', mountain: 'Montaña',
        rare: 'Raro', 'rough-terrain': 'Terreno escarpado', sea: 'Mar', urban: 'Urbano',
        'waters-edge': 'Orilla del agua'
    };
    return translations[habitat] ?? habitat;
}

function formatVariantName(name, isDefault) {
    if (isDefault) return 'Normal';
    return name.replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoveName(name) {
    return name.replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatItemName(name) {
    return formatMoveName(name);
}

function getDescription(species) {
    const entry = species.flavor_text_entries?.find(({ language }) => language.name === 'es')
        || species.flavor_text_entries?.find(({ language }) => language.name === 'en');
    return entry?.flavor_text?.replace(/[\n\f]/g, ' ') ?? 'Sin descripción disponible.';
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

function getStoredBoolean(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        return stored === null ? fallback : stored === 'true';
    } catch {
        return fallback;
    }
}

function scheduleCry(pokemon) {
    const cry = pokemon.cries?.latest || pokemon.cries?.legacy;
    if (!cry) return;
    window.clearTimeout(scheduleCry.timeout);
    scheduleCry.timeout = window.setTimeout(() => {
        const audio = new Audio(cry);
        audio.volume = 0.45;
        audio.play().catch(() => {});
    }, 120);
}
