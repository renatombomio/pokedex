import { getPokemon } from '../api/pokemon.js';
import { getAbility } from '../api/ability.js';
import { getMove } from '../api/move.js';

const TYPE_NAMES = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta',
    ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
    psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
    dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
};

const TYPE_COLORS = new Set(Object.keys(TYPE_NAMES));
let renderToken = 0;
let currentPokemonId = null;

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function capitalize(value) {
    return String(value ?? '').replace(/(^|-)([a-z])/g, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
}

function localName(resource, language = 'es') {
    return resource?.names?.find(({ language: itemLanguage }) => itemLanguage.name === language)?.name
        || resource?.name?.replaceAll('-', ' ')
        || '—';
}

function localizedEffect(resource, field = 'effect_entries') {
    const spanish = resource?.[field]?.find(({ language }) => language.name === 'es');
    const english = resource?.[field]?.find(({ language }) => language.name === 'en');
    return (spanish || english)?.effect?.replaceAll('$effect_chance', 'la probabilidad indicada')
        || (spanish || english)?.short_effect
        || 'No hay descripción disponible.';
}

function getPokemonId() {
    const number = document.querySelector('.gamedex-number')?.textContent?.replace(/\D/g, '');
    const id = Number(number);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function createPanel(className, eyebrow, title, content) {
    return `
        <section class="gamedex-advanced-panel ${className}" data-gamedex-advanced>
            <div class="gamedex-advanced-header">
                <div><span>${eyebrow}</span><h2>${title}</h2></div>
            </div>
            ${content}
        </section>
    `;
}

function renderLoading(detailContent) {
    const existing = detailContent.querySelector('[data-gamedex-advanced]');
    existing?.remove();
    const loading = document.createElement('section');
    loading.className = 'gamedex-advanced-panel gamedex-advanced-loading';
    loading.dataset.gamedexAdvanced = '';
    loading.innerHTML = '<span>Inteligencia de combate</span><h2>Cargando habilidades y movimientos...</h2>';
    detailContent.appendChild(loading);
    return loading;
}

async function renderAdvancedIntelligence() {
    const detailContent = document.querySelector('#detail-content');
    const card = detailContent?.querySelector('.gamedex-card');
    const id = getPokemonId();
    if (!detailContent || !card || !id) return;

    const token = ++renderToken;
    currentPokemonId = id;
    const loading = renderLoading(detailContent);

    try {
        const pokemon = await getPokemon(id);
        if (token !== renderToken || !detailContent.contains(loading)) return;

        const abilityEntry = pokemon.abilities?.find(({ is_hidden }) => !is_hidden) || pokemon.abilities?.[0];
        const ability = abilityEntry?.ability ? await getAbility(abilityEntry.ability.name) : null;
        const moveEntries = (pokemon.moves ?? [])
            .slice()
            .sort((a, b) => localName(a.move).localeCompare(localName(b.move), 'es'));

        loading.outerHTML = `
            ${ability ? renderAbilityPanel(ability, abilityEntry.is_hidden) : ''}
            ${renderMovesPanel(moveEntries)}
        `;
        bindAdvancedEvents();
    } catch (error) {
        if (token !== renderToken || !detailContent.contains(loading)) return;
        loading.className = 'gamedex-advanced-panel gamedex-advanced-error';
        loading.innerHTML = '<span>Inteligencia de combate</span><h2>No pudimos cargar habilidades y movimientos.</h2><p>Inténtalo de nuevo al abrir la ficha.</p>';
    }
}

function renderAbilityPanel(ability, isHidden = false) {
    const description = localizedEffect(ability);
    const abilityName = localName(ability);
    return createPanel(
        'gamedex-ability-panel',
        'Habilidad',
        abilityName,
        `
            <div class="gamedex-ability-detail">
                <p>${escapeHtml(description)}</p>
                <button type="button" class="gamedex-intelligence-action" data-gamedex-ability="${escapeHtml(ability.name)}">
                    Ver Pokémon con esta habilidad <span>→</span>
                </button>
                ${isHidden ? '<small>Esta es la habilidad oculta de esta ficha.</small>' : ''}
            </div>
        `
    );
}

function renderMovesPanel(moveEntries) {
    const limit = 36;
    const visible = moveEntries.slice(0, limit);
    return createPanel(
        'gamedex-moves-panel',
        'Movimientos',
        `${moveEntries.length} movimientos disponibles`,
        `
            <div class="gamedex-moves-grid">
                ${visible.map(({ move }) => `
                    <button type="button" class="gamedex-move-chip" data-gamedex-move="${escapeHtml(move.name)}">
                        ${escapeHtml(localName(move))}
                    </button>
                `).join('')}
            </div>
            ${moveEntries.length > limit ? `<p class="gamedex-moves-note">Mostrando ${limit} de ${moveEntries.length}. Usa la búsqueda de movimientos para consultar el resto.</p>` : ''}
        `
    );
}

async function openAbilityDetail(name) {
    const modal = openModal('Cargando habilidad...');
    try {
        const ability = await getAbility(name);
        const related = (ability.pokemon ?? []).slice().sort((a, b) => a.pokemon.name.localeCompare(b.pokemon.name, 'es'));
        modal.innerHTML = renderModalHeader('Habilidad', localName(ability), localizedEffect(ability)) + renderRelatedPokemon('Pokémon con esta habilidad', related);
        bindModalEvents(modal);
    } catch {
        modal.innerHTML = renderModalHeader('Habilidad', 'No disponible', 'No pudimos cargar esta habilidad.');
    }
}

async function openMoveDetail(name) {
    const modal = openModal('Cargando movimiento...');
    try {
        const move = await getMove(name);
        const damageClass = { physical: 'Físico', special: 'Especial', status: 'Estado' }[move.damage_class?.name] || '—';
        const type = TYPE_NAMES[move.type?.name] || capitalize(move.type?.name);
        const accuracy = move.accuracy == null ? '—' : `${move.accuracy}%`;
        const power = move.power == null ? '—' : move.power;
        const effect = localizedEffect(move, 'effect_entries');
        const related = (move.learned_by_pokemon ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
        modal.innerHTML = `
            ${renderModalHeader('Movimiento', localName(move), effect)}
            <div class="gamedex-move-stats">
                <div><span>Tipo</span><strong class="pokemon-type type-${escapeHtml(move.type?.name)}">${escapeHtml(type)}</strong></div>
                <div><span>Clase</span><strong>${damageClass}</strong></div>
                <div><span>Potencia</span><strong>${power}</strong></div>
                <div><span>Precisión</span><strong>${accuracy}</strong></div>
                <div><span>PP</span><strong>${move.pp ?? '—'}</strong></div>
            </div>
            ${renderRelatedPokemon('Pokémon que pueden aprenderlo', related)}
        `;
        bindModalEvents(modal);
    } catch {
        modal.innerHTML = renderModalHeader('Movimiento', 'No disponible', 'No pudimos cargar este movimiento.');
    }
}

function renderModalHeader(eyebrow, title, description) {
    return `<header class="gamedex-modal-header"><div><span>${eyebrow}</span><h2>${escapeHtml(title)}</h2></div><button type="button" class="gamedex-modal-close" data-gamedex-close aria-label="Cerrar">×</button><p>${escapeHtml(description)}</p></header>`;
}

function renderRelatedPokemon(title, related) {
    const max = 60;
    const visible = related.slice(0, max);
    return `
        <section class="gamedex-related">
            <div class="gamedex-related-header"><span>${title}</span><strong>${related.length}</strong></div>
            <div class="gamedex-related-grid">
                ${visible.map((entry) => `
                    <button type="button" class="gamedex-related-pokemon" data-gamedex-related-pokemon="${escapeHtml(entry.pokemon?.name || entry.name)}">
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getRelatedId(entry)}.png" alt="" loading="lazy">
                        <span>${escapeHtml(capitalize(entry.pokemon?.name || entry.name))}</span>
                    </button>
                `).join('')}
            </div>
            ${related.length > max ? `<p class="gamedex-related-note">Mostrando ${max} de ${related.length} Pokémon.</p>` : ''}
        </section>
    `;
}

function getRelatedId(entry) {
    const url = entry?.pokemon?.url || entry?.url || '';
    const match = url.match(/\/(\d+)\/?$/);
    return match?.[1] || '';
}

function openModal(content) {
    document.querySelector('[data-gamedex-modal]')?.remove();
    const modal = document.createElement('div');
    modal.className = 'gamedex-modal-backdrop';
    modal.dataset.gamedexModal = '';
    modal.innerHTML = `<div class="gamedex-modal" role="dialog" aria-modal="true">${content}</div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) modal.remove();
    });
    return modal.querySelector('.gamedex-modal');
}

function bindModalEvents(modal) {
    modal.querySelector('[data-gamedex-close]')?.addEventListener('click', () => modal.closest('[data-gamedex-modal]')?.remove());
    modal.querySelectorAll('[data-gamedex-related-pokemon]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = button.dataset.gamedexRelatedPokemon;
            document.dispatchEvent(new CustomEvent('pokemon:open-detail', { detail: { id: findPokemonId(button) } }));
            modal.closest('[data-gamedex-modal]')?.remove();
        });
    });
}

function findPokemonId(button) {
    const image = button.querySelector('img')?.src || '';
    return Number(image.match(/pokemon\/(\d+)\.png/)?.[1]);
}

function bindAdvancedEvents() {
    document.querySelectorAll('[data-gamedex-ability]').forEach((button) => {
        button.addEventListener('click', () => openAbilityDetail(button.dataset.gamedexAbility));
    });
    document.querySelectorAll('[data-gamedex-move]').forEach((button) => {
        button.addEventListener('click', () => openMoveDetail(button.dataset.gamedexMove));
    });
}

const observer = new MutationObserver(() => {
    const detailContent = document.querySelector('#detail-content');
    if (!detailContent?.querySelector('.gamedex-card') || detailContent.querySelector('[data-gamedex-advanced]')) return;
    window.clearTimeout(observer.renderTimer);
    observer.renderTimer = window.setTimeout(renderAdvancedIntelligence, 70);
});

function init() {
    const detailContent = document.querySelector('#detail-content');
    if (!detailContent) return;
    observer.observe(detailContent, { childList: true, subtree: true });
    renderAdvancedIntelligence();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
