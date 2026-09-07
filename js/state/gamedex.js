const detailContent = document.querySelector('#detail-content');

if (detailContent) {
    const observer = new MutationObserver(() => {
        buildGamedexCard();
        isolateEvolutionCards();
    });

    observer.observe(detailContent, { childList: true });
    buildGamedexCard();
    isolateEvolutionCards();
}

function buildGamedexCard() {
    const hero = detailContent.querySelector('.detail-hero');
    const grid = detailContent.querySelector('.detail-grid');

    if (!hero || !grid || detailContent.querySelector('.gamedex-card')) {
        return;
    }

    const heading = hero.querySelector('.detail-heading');
    const number = hero.querySelector('.detail-number')?.textContent.trim() || '';
    const name = heading?.querySelector('h1')?.textContent.trim() || '';
    const types = heading?.querySelector('.pokemon-types')?.innerHTML || '';
    const image = hero.querySelector('.detail-image img');

    const physical = [...grid.querySelectorAll('.physical-data > div')];
    const ability = grid.querySelector('.abilities .ability')?.textContent.trim() || '—';
    const description = grid.querySelector('.pokemon-description')?.textContent.trim() || '';
    const statRows = [...grid.querySelectorAll('.stats .stat-row')];

    const typeClass =
        heading?.querySelector('.pokemon-type')?.className
            .split(' ')
            .find((className) => className.startsWith('type-')) ||
        'type-normal';

    const card = document.createElement('article');
    card.className = `gamedex-card ${typeClass}`;

    card.innerHTML = `
        <header class="gamedex-header">
            <div class="gamedex-title">
                <h1>${escapeHtml(name)}</h1>
                <div class="gamedex-types">${types}</div>
            </div>
            <span class="gamedex-number">${escapeHtml(number)}</span>
        </header>

        <div class="gamedex-artwork" aria-hidden="true">
            <div class="gamedex-orbit gamedex-orbit-back"></div>
            <div class="gamedex-orbit gamedex-orbit-front"></div>
            ${image ? `<img src="${escapeAttribute(image.getAttribute('src') || '')}" alt="">` : ''}
        </div>

        <div class="gamedex-meta" aria-label="Información principal">
            ${createMetaItem(physical[0], 'Altura')}
            ${createMetaItem(physical[1], 'Peso')}
            <div class="gamedex-meta-item gamedex-ability">
                <span>Habilidad</span>
                <strong>${escapeHtml(ability)}</strong>
            </div>
        </div>

        <div class="gamedex-stats" aria-label="Estadísticas base">
            ${statRows.map(createStat).join('')}
        </div>
    `;

    const info = document.createElement('section');
    info.className = 'pokemon-about';
    info.innerHTML = `
        <div class="pokemon-about-header">
            <span>Pokédex</span>
            <h2>Sobre ${escapeHtml(name)}</h2>
        </div>
        <p>${escapeHtml(description)}</p>
    `;

    hero.replaceWith(card);
    grid.remove();
    detailContent.insertBefore(info, detailContent.querySelector('.evolution-section'));
}

function isolateEvolutionCards() {
    detailContent
        .querySelectorAll('.evolution-card.pokemon-card')
        .forEach((card) => card.classList.remove('pokemon-card'));
}

function createMetaItem(element, fallbackLabel) {
    const label = element?.querySelector('span')?.textContent.trim() || fallbackLabel;
    const value = element?.querySelector('strong')?.textContent.trim() || '—';

    return `
        <div class="gamedex-meta-item">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
        </div>
    `;
}

function createStat(row) {
    const label = row.querySelector('.stat-header span')?.textContent.trim() || '';
    const value = row.querySelector('.stat-header strong')?.textContent.trim() || '0';
    const bar = row.querySelector('.stat-bar');
    const fill = bar?.querySelector('span');
    const width = fill?.style.width || '0%';
    const typeClass =
        bar?.className
            .split(' ')
            .find((className) => className.startsWith('type-')) ||
        'type-normal';

    const shortLabel = {
        'PS': 'PS',
        'Ataque': 'ATQ',
        'Defensa': 'DEF',
        'At. Especial': 'ATQ ESP',
        'Def. Especial': 'DEF ESP',
        'Velocidad': 'VEL'
    }[label] || label.slice(0, 7).toUpperCase();

    return `
        <div class="gamedex-stat ${typeClass}">
            <div class="gamedex-stat-top">
                <span>${escapeHtml(shortLabel)}</span>
                <strong>${escapeHtml(value)}</strong>
            </div>
            <div class="gamedex-stat-track">
                <span style="width:${escapeAttribute(width)}"></span>
            </div>
        </div>
    `;
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
