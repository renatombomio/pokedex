import { getType } from '../api/type.js';

const TYPE_NAMES = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta',
    ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
    psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
    dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
};

const RELATION_KEYS = {
    double_damage_from: 2,
    half_damage_from: 0.5,
    no_damage_from: 0
};

let renderToken = 0;

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getPokemonTypes() {
    return [...document.querySelectorAll('.gamedex-types .pokemon-type')]
        .flatMap((element) => [...element.classList]
            .filter((className) => className.startsWith('type-'))
            .map((className) => className.slice(5)))
        .filter((type, index, types) => types.indexOf(type) === index);
}

function formatMultiplier(value) {
    if (value === 0) return '×0';
    if (value === 0.25) return '×¼';
    if (value === 0.5) return '×½';
    if (value === 2) return '×2';
    if (value === 4) return '×4';
    return `×${value}`;
}

function createTypeChip(type, multiplier) {
    return `
        <div class="gamedex-effectiveness-chip type-${escapeHtml(type)}">
            <span class="gamedex-effectiveness-type">${escapeHtml(TYPE_NAMES[type] ?? type)}</span>
            <strong>${formatMultiplier(multiplier)}</strong>
        </div>
    `;
}

function createGroup(title, eyebrow, entries, modifierClass, emptyText) {
    return `
        <section class="gamedex-effectiveness-group ${modifierClass}">
            <div class="gamedex-effectiveness-group-header">
                <div>
                    <span>${eyebrow}</span>
                    <h3>${title}</h3>
                </div>
                <strong>${entries.length}</strong>
            </div>
            <div class="gamedex-effectiveness-grid">
                ${entries.length ? entries.map(([type, multiplier]) => createTypeChip(type, multiplier)).join('') : `<p class="gamedex-effectiveness-empty">${emptyText}</p>`}
            </div>
        </section>
    `;
}

async function renderTypeEffectiveness() {
    const detailContent = document.querySelector('#detail-content');
    if (!detailContent || !detailContent.querySelector('.gamedex-card')) return;

    const types = getPokemonTypes();
    if (!types.length) return;

    const token = ++renderToken;
    const existing = detailContent.querySelector('[data-gamedex-effectiveness]');
    if (existing) existing.remove();

    const loading = document.createElement('section');
    loading.className = 'gamedex-effectiveness gamedex-effectiveness-loading';
    loading.dataset.gamedexEffectiveness = '';
    loading.innerHTML = '<span>Inteligencia de combate</span><h2>Analizando afinidades...</h2>';
    detailContent.appendChild(loading);

    try {
        const typeData = await Promise.all(types.map((type) => getType(type)));
        if (token !== renderToken || !detailContent.contains(loading)) return;

        const multipliers = Object.fromEntries(Object.keys(TYPE_NAMES).map((type) => [type, 1]));

        for (const data of typeData) {
            for (const [relation, multiplier] of Object.entries(RELATION_KEYS)) {
                for (const target of data.damage_relations?.[relation] ?? []) {
                    if (multipliers[target.name] !== undefined) {
                        multipliers[target.name] *= multiplier;
                    }
                }
            }
        }

        const weaknesses = Object.entries(multipliers)
            .filter(([, value]) => value > 1)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        const resistances = Object.entries(multipliers)
            .filter(([, value]) => value > 0 && value < 1)
            .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
        const immunities = Object.entries(multipliers)
            .filter(([, value]) => value === 0)
            .sort(([a], [b]) => a.localeCompare(b));

        loading.className = 'gamedex-effectiveness';
        loading.innerHTML = `
            <div class="gamedex-effectiveness-header">
                <div>
                    <span>Inteligencia de combate</span>
                    <h2>Efectividad de tipos</h2>
                </div>
                <p>Cómo afectan los 18 tipos a este Pokémon.</p>
            </div>
            <div class="gamedex-effectiveness-groups">
                ${createGroup('Debilidades', 'Recibe más daño', weaknesses, 'is-weakness', 'Sin debilidades.')}
                ${createGroup('Resistencias', 'Recibe menos daño', resistances, 'is-resistance', 'Sin resistencias.')}
                ${createGroup('Inmunidades', 'Daño anulado', immunities, 'is-immunity', 'Sin inmunidades.')}
            </div>
        `;
    } catch {
        if (token !== renderToken || !detailContent.contains(loading)) return;
        loading.className = 'gamedex-effectiveness gamedex-effectiveness-error';
        loading.innerHTML = '<span>Inteligencia de combate</span><h2>No pudimos calcular las afinidades.</h2><p>Inténtalo de nuevo al abrir la ficha.</p>';
    }
}

const observer = new MutationObserver(() => {
    const detailContent = document.querySelector('#detail-content');
    if (!detailContent?.querySelector('.gamedex-card') || detailContent.querySelector('[data-gamedex-effectiveness]')) return;
    window.clearTimeout(observer.renderTimer);
    observer.renderTimer = window.setTimeout(renderTypeEffectiveness, 40);
});

function init() {
    const detailContent = document.querySelector('#detail-content');
    if (!detailContent) return;
    observer.observe(detailContent, { childList: true, subtree: true });
    renderTypeEffectiveness();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
