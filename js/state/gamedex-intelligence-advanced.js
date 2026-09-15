import { getAbility } from '../api/ability.js';
import { getDetailsState } from './details.js';

const TYPE_NAMES = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta',
    ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
    psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
    dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
};

let renderToken = 0;

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

function getCurrentPokemon() {
    const pokemon = getDetailsState().pokemon;
    return pokemon?.id ? pokemon : null;
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
    const pokemon = getCurrentPokemon();
    if (!detailContent || !card || !pokemon) return;

    const token = ++renderToken;
    const loading = renderLoading(detailContent);
    const abilityEntry = pokemon.abilities?.find(({ is_hidden }) => !is_hidden) || pokemon.abilities?.[0] || null;
    const moveEntries = (pokemon.moves ?? [])
        .slice()
        .sort((a, b) => localName(a.move).localeCompare(localName(b.move), 'es'));

    loading.outerHTML = `
        ${renderAbilityLoadingPanel(abilityEntry)}
        ${renderMovesPanel(moveEntries)}
    `;

    if (!abilityEntry?.ability?.name) return;

    try {
        const ability = await getAbility(abilityEntry.ability.name);
        const current = getCurrentPokemon();
        if (token !== renderToken || current?.id !== pokemon.id) return;

        const abilityPanel = detailContent.querySelector('.gamedex-ability-panel[data-gamedex-advanced]');
        if (!abilityPanel) return;
        abilityPanel.outerHTML = renderAbilityPanel(ability, abilityEntry.is_hidden);
        bindAdvancedEvents();
    } catch {
        if (token !== renderToken || getCurrentPokemon()?.id !== pokemon.id) return;
        const abilityPanel = detailContent.querySelector('.gamedex-ability-panel[data-gamedex-advanced]');
        if (!abilityPanel) return;
        abilityPanel.outerHTML = createPanel(
            'gamedex-ability-panel gamedex-advanced-error',
            'Habilidad',
            'Información no disponible',
            '<p>No pudimos cargar la descripción de esta habilidad.</p>'
        );
    }
}

function renderAbilityLoadingPanel(abilityEntry) {
    const title = abilityEntry?.ability?.name
        ? capitalize(abilityEntry.ability.name.replaceAll('-', ' '))
        : 'Habilidad';
    return createPanel(
        'gamedex-ability-panel gamedex-ability-loading',
        'Habilidad',
        title,
        '<div class="gamedex-ability-detail"><p>Cargando descripción...</p></div>'
    );
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

function bindModalEvents(modal) {
    modal.querySelector('[data-gamedex-close]')?.addEventListener('click', () => modal.closest('[data-gamedex-modal]')?.remove());
    modal.querySelectorAll('[data-gamedex-related-pokemon]').forEach((button) => {
        button.addEventListener('click', () => {
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
}

const observer = new MutationObserver(() => {
    const detailContent = document.querySelector('#detail-content');
    if (!detailContent?.querySelector('.gamedex-card') || detailContent.querySelector('[data-gamedex-advanced]')) return;
    window.clearTimeout(observer.renderTimer);
    observer.renderTimer = window.setTimeout(renderAdvancedIntelligence, 40);
});

function init() {
    const detailContent = document.querySelector('#detail-content');
    if (!detailContent) return;
    observer.observe(detailContent, { childList: true, subtree: true });
    renderAdvancedIntelligence();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
