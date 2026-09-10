import { getDetailsState } from './details.js';
import { getCapturedPokemon, isPokemonCaptured, saveCapturedPokemon } from './captured.js';

const CAPTURE_BUTTON_SELECTOR = '[data-gamedex-capture]';
const BALL_BONUS = { Poke: 1 };
const detailContent = document.querySelector('#detail-content');
let captureRequestId = 0;

if (detailContent) {
    const observer = new MutationObserver(() => window.requestAnimationFrame(ensureCaptureControls));
    observer.observe(detailContent, { childList: true, subtree: true });
    window.requestAnimationFrame(ensureCaptureControls);
    detailContent.addEventListener('click', handleCaptureClick);
}

export { getCapturedPokemon, isPokemonCaptured };

function ensureCaptureControls() {
    const card = detailContent?.querySelector('.gamedex-card');
    const artwork = card?.querySelector('.gamedex-artwork');
    const button = card?.querySelector(CAPTURE_BUTTON_SELECTOR);
    if (!card || !artwork || !button) return;

    const pokemon = getDetailsState().pokemon;
    if (!pokemon) return;

    const captured = isPokemonCaptured(pokemon.id);
    button.disabled = captured;
    button.setAttribute('aria-pressed', String(captured));
    button.setAttribute('aria-label', captured
        ? `${displayPokemonName(pokemon)} ya está capturado`
        : `Capturar ${displayPokemonName(pokemon)}`);
    button.title = captured ? 'Pokémon capturado' : 'Lanzar Poké Ball';
    button.classList.toggle('is-captured', captured);

    if (!artwork.querySelector('.gamedex-capture-layer')) {
        const layer = document.createElement('div');
        layer.className = 'gamedex-capture-layer';
        layer.setAttribute('aria-hidden', 'true');
        layer.innerHTML = `
            <div class="gamedex-capture-impact"></div>
            <div class="gamedex-capture-ball">
                <span class="gamedex-capture-ball-top"></span>
                <span class="gamedex-capture-ball-bottom"></span>
                <span class="gamedex-capture-ball-band"></span>
                <span class="gamedex-capture-ball-button"></span>
                <span class="gamedex-capture-stars" aria-hidden="true">
                    <span>★</span><span>★</span><span>★</span>
                </span>
            </div>
        `;
        artwork.append(layer);
    }
}

async function handleCaptureClick(event) {
    const button = event.target.closest(CAPTURE_BUTTON_SELECTOR);
    if (!button || button.disabled) return;

    const state = getDetailsState();
    const pokemon = state.pokemon;
    const species = state.species;
    const artwork = detailContent?.querySelector('.gamedex-artwork');
    const image = artwork?.querySelector('img');
    const ball = artwork?.querySelector('.gamedex-capture-ball');
    if (!pokemon || !species || !artwork || !image || !ball) return;

    const requestId = ++captureRequestId;
    button.disabled = true;

    const result = simulateCapture({
        maxHp: getBaseHp(pokemon),
        currentHp: 1,
        captureRate: Number(species.capture_rate) || 0,
        ballBonus: BALL_BONUS.Poke,
        statusBonus: 2.5
    });

    await playCaptureAnimation({ artwork, image, ball, result, requestId });
    if (requestId !== captureRequestId) return;

    if (result.captured) {
        saveCapturedPokemon(pokemon.id);
        button.setAttribute('aria-pressed', 'true');
        button.setAttribute('aria-label', `${displayPokemonName(pokemon)} ya está capturado`);
        button.title = 'Pokémon capturado';
        button.classList.add('is-captured');
        document.dispatchEvent(new CustomEvent('captured:changed', { detail: { id: pokemon.id } }));
        showCaptureMessage(artwork, '¡Pokémon capturado!', true);
    } else {
        button.disabled = false;
        showCaptureMessage(artwork, '¡Se ha escapado!', false);
    }
}

function getBaseHp(pokemon) {
    const hp = pokemon.stats?.find(({ stat }) => stat?.name === 'hp')?.base_stat;
    return Math.max(1, Number(hp) || 1);
}

function simulateCapture({ maxHp, currentHp, captureRate, ballBonus, statusBonus }) {
    const a = calculateCaptureValue({ maxHp, currentHp, captureRate, ballBonus, statusBonus });
    const shakes = [];
    for (let index = 0; index < 3; index += 1) {
        const success = performShakeCheck(a);
        shakes.push(success);
        if (!success) return { captured: false, shakes, a };
    }
    return { captured: true, shakes, a };
}

function calculateCaptureValue({ maxHp, currentHp, captureRate, ballBonus, statusBonus }) {
    const numerator = (3 * maxHp - 2 * currentHp) * captureRate * ballBonus;
    const denominator = 3 * maxHp;
    return Math.min(255, Math.max(0, Math.floor(floor4096(numerator / denominator) * statusBonus)));
}

function floor4096(value) {
    return Math.floor(value * 4096) / 4096;
}

function performShakeCheck(a) {
    if (a >= 255) return true;
    if (a <= 0) return false;
    const threshold = Math.floor(65536 / Math.pow(255 / a, 0.25));
    return Math.floor(Math.random() * 65536) < threshold;
}

function getShakeCount(result) {
    if (result.captured) return 3;
    return Math.max(0, result.shakes.length - 1);
}

function wait(duration) {
    return new Promise((resolve) => window.setTimeout(resolve, duration));
}

async function playCaptureAnimation({ artwork, image, ball, result, requestId }) {
    const rect = artwork.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const startX = rect.width * -0.22;
    const startY = rect.height * 0.85;
    const targetX = imageRect.left + imageRect.width / 2 - rect.left;
    const targetY = imageRect.top + imageRect.height / 2 - rect.top;
    const shakeCount = getShakeCount(result);

    artwork.classList.remove('is-capturing', 'is-captured', 'is-escaped', 'is-impact');
    ball.classList.remove('is-throwing', 'is-shaking', 'is-success', 'is-failed', 'is-at-target');
    image.classList.remove('is-capture-target');
    ball.querySelector('.gamedex-capture-stars')?.classList.remove('is-active');

    artwork.style.setProperty('--capture-start-x', `${startX}px`);
    artwork.style.setProperty('--capture-start-y', `${startY}px`);
    artwork.style.setProperty('--capture-target-x', `${targetX}px`);
    artwork.style.setProperty('--capture-target-y', `${targetY}px`);

    artwork.classList.add('is-capturing');
    ball.classList.add('is-throwing');

    await wait(820);
    if (requestId !== captureRequestId) return;

    artwork.classList.add('is-impact');
    image.classList.add('is-capture-target');
    ball.classList.remove('is-throwing');
    ball.classList.add('is-at-target');

    await wait(430);
    if (requestId !== captureRequestId) return;

    for (let index = 0; index < shakeCount; index += 1) {
        ball.classList.remove('is-shaking');
        void ball.offsetWidth;
        ball.classList.add('is-shaking');
        await wait(560);
        if (requestId !== captureRequestId) return;
        if (index < shakeCount - 1) await wait(260);
    }

    if (shakeCount > 0) await wait(180);
    if (requestId !== captureRequestId) return;

    artwork.classList.remove('is-impact');
    artwork.classList.add(result.captured ? 'is-captured' : 'is-escaped');
    ball.classList.remove('is-shaking', 'is-at-target');
    ball.classList.add(result.captured ? 'is-success' : 'is-failed');
    if (!result.captured) image.classList.remove('is-capture-target');

    await wait(520);
}

function showCaptureMessage(artwork, text, success) {
    const existing = artwork.querySelector('.gamedex-capture-message');
    existing?.remove();
    const message = document.createElement('div');
    message.className = `gamedex-capture-message${success ? ' is-success' : ' is-failed'}`;
    message.textContent = text;
    artwork.append(message);
    window.setTimeout(() => message.remove(), 2200);
}

function displayPokemonName(pokemon) {
    return pokemon?.name ? pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1) : 'Pokémon';
}
