import { getEvolutionTree } from './details.js';
import { getPokemon } from '../api/pokemon.js';
import { isFavorite } from './favorites.js';

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
    const favorite = isFavorite(pokemon.id);
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
                <button class="favorite-toggle${favorite ? ' is-favorite' : ''}" type="button" data-pokemon-id="${pokemon.id}" aria-pressed="${favorite}" aria-label="${favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}" title="${favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
                    <span aria-hidden="true">♥</span>
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

function createEvolutionCard(pokemon, details = []) {
    const condition = formatEvolutionCondition(details);

    return `
        <article class="evolution-card" data-pokemon-id="${pokemon.id}">
            <button class="evolution-card-button" type="button" data-pokemon-id="${pokemon.id}" aria-label="Ver ${escapeHtml(capitalize(pokemon.name))}">
                <span class="evolution-number">#${formatId(pokemon.id)}</span>
                <img src="${escapeAttribute(getEvolutionImage(pokemon.id))}" alt="${escapeAttribute(capitalize(pokemon.name))}" loading="lazy">
                <strong>${escapeHtml(capitalize(pokemon.name))}</strong>
                ${condition ? `<small class="evolution-card-condition">${escapeHtml(condition)}</small>` : ''}
            </button>
        </article>
    `;
}

function formatEvolutionCondition(details) {
    const detail = details?.[0];
    if (!detail) return '';
    if (detail.minLevel) return `Nivel ${detail.minLevel}`;
    if (detail.item) return `Objeto: ${formatItem(detail.item)}`;
    if (detail.heldItem) return `Objeto equipado: ${formatItem(detail.heldItem)}`;
    if (detail.knownMove) return `Movimiento: ${capitalize(detail.knownMove.replaceAll('-', ' '))}`;
    if (detail.location) return `Lugar: ${formatItem(detail.location)}`;
    if (detail.timeOfDay) return `Momento: ${detail.timeOfDay}`;
    if (detail.minHappiness) return `Amistad ${detail.minHappiness}`;
    if (detail.minBeauty) return `Belleza ${detail.minBeauty}`;
    if (detail.minAffection) return `Afecto ${detail.minAffection}`;
    if (detail.trigger === 'trade') return 'Intercambio';
    if (detail.needsOverworldRain) return 'Lluvia en el mapa';
    if (detail.turnUpsideDown) return 'Consola invertida';
    return detail.trigger ? translateEvolutionTrigger(detail.trigger) : '';
}

function getEvolutionImage(id) {
    return id
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
        : '';
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

function getStaticImage(pokemon, shiny = false) {
    const artwork = pokemon.sprites?.other?.['official-artwork'];
    const key = shiny ? 'front_shiny' : 'front_default';
    return artwork?.[key] || pokemon.sprites?.[key] || '';
}

function getShinyImage(pokemon) {
    return pokemon.sprites?.other?.['official-artwork']?.front_shiny
        || pokemon.sprites?.front_shiny
        || '';
}

function getAnimatedImage(pokemon, shiny = false) {
    const showdown = pokemon.sprites?.other?.showdown;
    const key = shiny ? 'front_shiny' : 'front_default';
    return showdown?.[key] || '';
}

function getPrimaryAbility(pokemon) {
    const ability = pokemon.abilities?.find(({ is_hidden }) => !is_hidden)?.ability?.name;
    return ability ? translateAbility(ability) : '—';
}

function getDescription(species) {
    const spanish = species.flavor_text_entries?.find(({ language }) => language.name === 'es');
    const english = species.flavor_text_entries?.find(({ language }) => language.name === 'en');
    const entry = spanish || english;
    if (!entry) return 'No hay descripción disponible.';
    return entry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ');
}

function formatHeight(height) {
    return `${(height / 10).toFixed(1)} m`;
}

function formatWeight(weight) {
    return `${(weight / 10).toFixed(1)} kg`;
}

function formatId(id) {
    return String(id).padStart(3, '0');
}

function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

function displayPokemonName(pokemon) {
    return pokemon.form_name
        ? `${pokemon.species?.name ?? pokemon.name} · ${pokemon.form_name}`
        : capitalize(pokemon.name);
}

function formatItem(value) {
    return capitalize(String(value).replaceAll('-', ' '));
}

function formatVariantName(name, isDefault = false) {
    if (isDefault) return 'Normal';
    return capitalize(String(name).replaceAll('-', ' '));
}

function formatGeneration(value) {
    const match = String(value).match(/generation-([ivx]+)/i);
    return match
        ? `Generación ${match[1].toUpperCase()}`
        : capitalize(String(value).replaceAll('-', ' '));
}

function translateHabitat(value) {
    const translations = {
        cave: 'Cueva',
        forest: 'Bosque',
        grassland: 'Pradera',
        mountain: 'Montaña',
        rare: 'Raro',
        roughTerrain: 'Terreno accidentado',
        sea: 'Mar',
        urban: 'Urbano',
        watersEdge: 'Orilla del agua'
    };
    return translations[value] ?? formatItem(value);
}

function translateEvolutionTrigger(value) {
    const translations = {
        'level-up': 'Sube de nivel',
        trade: 'Intercambio',
        'use-item': 'Usar objeto',
        shed: 'Muda',
        spin: 'Girar',
        'tower-of-darkness': 'Torre de la Oscuridad',
        'tower-of-waters': 'Torre de las Aguas',
        'three-critical-hits': 'Tres golpes críticos',
        'take-damage': 'Recibir daño'
    };
    return translations[value] ?? formatItem(value);
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
    return translations[ability] ?? formatItem(ability);
}

function getStoredBoolean(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value === 'true';
    } catch {
        return fallback;
    }
}

function setStoredBoolean(key, value) {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // Storage may be unavailable in private or restricted contexts.
    }
}

function scheduleCry(pokemon) {
    window.setTimeout(() => playCry(pokemon), 180);
}

function playCry(pokemon) {
    const url = pokemon.cries?.latest || pokemon.cries?.legacy;
    if (!url || !getStoredBoolean(AUDIO_PREFERENCE_KEY, true)) return;

    const audio = new Audio(url);
    audio.volume = 0.35;
    audio.play().catch(() => {});
}

async function selectForm(identifier) {
    const requestId = ++formRequestId;

    try {
        const pokemon = await getPokemon(identifier);
        if (requestId !== formRequestId) return;

        currentPokemon = pokemon;
        currentShiny = false;
        renderCurrentGamedex();
        if (getStoredBoolean(AUDIO_PREFERENCE_KEY, true)) scheduleCry(pokemon);
    } catch (error) {
        console.error('Could not load Pokémon form:', error);
    }
}

detailContent?.addEventListener('click', (event) => {
    const formChip = event.target.closest('[data-gamedex-form-chip]');
    if (formChip) {
        event.preventDefault();
        selectForm(formChip.dataset.gamedexFormChip);
        return;
    }

    const animationButton = event.target.closest('[data-gamedex-animation]');
    if (animationButton) {
        const canAnimate = Boolean(getAnimatedImage(currentPokemon, currentShiny));
        const next = currentImageMode !== 'animated' && canAnimate;
        currentImageMode = next ? 'animated' : 'static';
        setStoredBoolean(ANIMATION_PREFERENCE_KEY, next);
        renderCurrentGamedex();
        return;
    }

    const shinyButton = event.target.closest('[data-gamedex-shiny]');
    if (shinyButton) {
        currentShiny = !currentShiny;
        renderCurrentGamedex();
        if (getStoredBoolean(AUDIO_PREFERENCE_KEY, true)) playCry(currentPokemon);
        return;
    }

    const audioButton = event.target.closest('[data-gamedex-audio]');
    if (audioButton) {
        const enabled = !getStoredBoolean(AUDIO_PREFERENCE_KEY, true);
        setStoredBoolean(AUDIO_PREFERENCE_KEY, enabled);
        renderCurrentGamedex();
        if (enabled) playCry(currentPokemon);
    }
});

export function hideGamedex() {
    const detailSection = document.querySelector('#pokemon-detail');
    detailSection?.classList.add('hidden');
    detailSection?.setAttribute('aria-hidden', 'true');
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
