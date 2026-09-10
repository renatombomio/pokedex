const detailContent = document.querySelector('#detail-content');

const TYPE_BACKGROUND_PATH = 'assets/type-backgrounds';

const TYPE_COLORS = {
    normal: '#a8a29e',
    fire: '#f97316',
    water: '#3b82f6',
    grass: '#4caf50',
    electric: '#eab308',
    ice: '#67e8f9',
    fighting: '#dc5a3d',
    poison: '#a855c7',
    ground: '#c98b4b',
    flying: '#818cf8',
    psychic: '#e56b9d',
    bug: '#84a83d',
    rock: '#9a8058',
    ghost: '#8b6bc4',
    dragon: '#6366d9',
    dark: '#57534e',
    steel: '#78909c',
    fairy: '#d878a4'
};

function getCardType(card) {
    const typeClass = [...card.classList].find((className) => className.startsWith('type-'));
    return typeClass ? typeClass.slice(5) : 'normal';
}

function revealTypeBackground(card) {
    if (!card || card.classList.contains('has-type-background')) return;

    const type = getCardType(card);
    const backgroundUrl = `${TYPE_BACKGROUND_PATH}/${type}.png`;
    const accent = TYPE_COLORS[type] ?? TYPE_COLORS.normal;

    const background = document.createElement('div');
    background.className = 'gamedex-type-background';
    background.setAttribute('aria-hidden', 'true');
    background.style.backgroundImage = `url("${backgroundUrl}")`;

    card.style.setProperty('--gamedex-type-color', accent);
    card.style.setProperty('--gamedex-type-background', `url("${backgroundUrl}")`);
    card.dataset.typeBackground = type;
    card.prepend(background);

    requestAnimationFrame(() => card.classList.add('has-type-background'));
}

detailContent?.addEventListener('click', (event) => {
    const card = event.target.closest('.gamedex-card');
    if (!card) return;

    if (event.target.closest('button, a, select, input, textarea, option')) return;

    revealTypeBackground(card);
});
