const detailContent = document.querySelector('#detail-content');

const TYPE_BACKGROUND_PATH = '../assets/type-backgrounds';

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

function applyTypeBackground(card) {
    if (!card || card.classList.contains('has-type-background')) return;

    const type = getCardType(card);
    const typeColor = TYPE_COLORS[type] ?? TYPE_COLORS.normal;

    card.style.setProperty('--gamedex-type-color', typeColor);
    card.style.setProperty(
        '--gamedex-type-background-image',
        `url("${TYPE_BACKGROUND_PATH}/${type}.png")`
    );
    card.classList.add('has-type-background');
}

function applyBackgrounds() {
    detailContent?.querySelectorAll('.gamedex-card').forEach(applyTypeBackground);
}

/* The detail card is rendered dynamically, so attach the background as soon as it appears. */
if (detailContent) {
    applyBackgrounds();

    const observer = new MutationObserver(applyBackgrounds);
    observer.observe(detailContent, { childList: true, subtree: true });
}
