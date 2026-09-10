const detailContent = document.querySelector('#detail-content');

const TYPE_BACKGROUND_PATH = 'assets/type-backgrounds';

function getCardType(card) {
    const typeClass = [...card.classList].find((className) => className.startsWith('type-'));
    return typeClass ? typeClass.slice(5) : 'normal';
}

function revealTypeBackground(card) {
    if (!card || card.classList.contains('has-type-background')) return;

    const type = getCardType(card);
    const background = document.createElement('div');
    background.className = 'gamedex-type-background';
    background.setAttribute('aria-hidden', 'true');
    background.style.backgroundImage = `linear-gradient(145deg, rgba(8,8,8,.18), rgba(8,8,8,.48)), url("${TYPE_BACKGROUND_PATH}/${type}.png")`;

    card.prepend(background);
    requestAnimationFrame(() => card.classList.add('has-type-background'));
}

detailContent?.addEventListener('click', (event) => {
    const card = event.target.closest('.gamedex-card');
    if (!card) return;

    if (event.target.closest('button, a, select, input, textarea, option')) return;

    revealTypeBackground(card);
});
