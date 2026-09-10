import { getDetailsState } from './details.js';
import { getCapturedPokemon, isPokemonCaptured, saveCapturedPokemon } from './captured.js';
import './gamedex-capture-persistence.js';

const CAPTURE_BUTTON_SELECTOR = '[data-gamedex-capture]';
const BALL_BONUS = { Poke: 1 };
const detailContent = document.querySelector('#detail-content');
let captureRequestId = 0;

if (detailContent) {
    installCaptureEffects();
    const observer = new MutationObserver(() => window.requestAnimationFrame(ensureCaptureControls));
    observer.observe(detailContent, { childList: true, subtree: true });
    window.requestAnimationFrame(ensureCaptureControls);
    detailContent.addEventListener('click', handleCaptureClick);
}

export { getCapturedPokemon, isPokemonCaptured };

function installCaptureEffects() {
    const styleId = 'gamedex-capture-absorption-effects';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .gamedex-capture-ball.is-opening .gamedex-capture-ball-top {
            animation: gamedex-ball-open-top .28s cubic-bezier(.2,.8,.2,1) both;
            transform-origin: 50% 100%;
        }
        .gamedex-capture-ball.is-opening .gamedex-capture-ball-bottom {
            animation: gamedex-ball-open-bottom .28s cubic-bezier(.2,.8,.2,1) both;
            transform-origin: 50% 0%;
        }
        .gamedex-capture-ball.is-opening .gamedex-capture-ball-button {
            animation: gamedex-ball-open-button .28s ease-out both;
        }
        .gamedex-capture-ball.is-absorbing {
            box-shadow: 0 0 0 4px rgb(255 255 255 / 12%), 0 0 34px 12px rgb(255 225 110 / 42%);
        }
        .gamedex-capture-ball.is-absorbing::after {
            content: '';
            position: absolute;
            inset: -18%;
            border: 2px solid rgb(255 255 255 / 58%);
            border-radius: 50%;
            opacity: 0;
            animation: gamedex-capture-vortex .56s cubic-bezier(.2,.75,.25,1) forwards;
        }
        .gamedex-artwork img.is-capture-absorbing {
            animation: gamedex-capture-absorb .56s cubic-bezier(.28,.82,.2,1) forwards !important;
            transform-origin: 50% 50%;
            will-change: transform, opacity, filter;
        }
        .gamedex-artwork img.is-capture-escape {
            animation: gamedex-capture-escape .62s cubic-bezier(.16,.82,.25,1) forwards !important;
            transform-origin: 50% 55%;
            will-change: transform, opacity, filter;
        }
        @keyframes gamedex-ball-open-top {
            0% { transform: translateY(0) rotate(0); }
            100% { transform: translateY(-9px) rotate(-8deg); }
        }
        @keyframes gamedex-ball-open-bottom {
            0% { transform: translateY(0) rotate(0); }
            100% { transform: translateY(9px) rotate(8deg); }
        }
        @keyframes gamedex-ball-open-button {
            0% { transform: translate(-50%,-50%) scale(1); }
            100% { transform: translate(-50%,-50%) scale(.72); }
        }
        @keyframes gamedex-capture-vortex {
            0% { opacity: 0; transform: scale(.35); }
            25% { opacity: 1; }
            100% { opacity: 0; transform: scale(1.8); }
        }
        @keyframes gamedex-capture-absorb {
            0% { opacity: 1; transform: scale(1.02); filter: brightness(1) blur(0); }
            20% { opacity: 1; transform: scale(1.08); filter: brightness(1.8) blur(0); }
            48% { opacity: .72; transform: scale(.55); filter: brightness(1.45) blur(1px); }
            76% { opacity: .28; transform: scale(.18); filter: brightness(2) blur(4px); }
            100% { opacity: 0; transform: scale(.025); filter: brightness(2.4) blur(7px); }
        }
        @keyframes gamedex-capture-escape {
            0% { opacity: 0; transform: scale(.05) translateY(0); filter: brightness(2.2) blur(6px); }
            22% { opacity: .9; transform: scale(.34) translateY(-2px); filter: brightness(1.5) blur(2px); }
            58% { opacity: 1; transform: scale(1.06) translateY(-18px); filter: brightness(1.08) blur(0); }
            78% { opacity: 1; transform: scale(.97) translateY(4px); }
            100% { opacity: 1; transform: scale(1) translateY(0); filter: brightness(1) blur(0); }
        }
    `;
    document.head.append(style);
}

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
    ball.classList.remove('is-throwing', 'is-shaking', 'is-success', 'is-failed', 'is-at-target', 'is-opening', 'is-absorbing');
    image.classList.remove('is-capture-target', 'is-capture-absorbing', 'is-capture-escape');
    image.style.opacity = '';
    image.style.visibility = '';
    image.style.pointerEvents = '';
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
    ball.classList.add('is-at-target', 'is-opening');

    await wait(250);
    if (requestId !== captureRequestId) return;

    image.classList.add('is-capture-absorbing');
    ball.classList.add('is-absorbing');

    await wait(560);
    if (requestId !== captureRequestId) return;

    ball.classList.remove('is-opening', 'is-absorbing');

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

    if (result.captured) {
        artwork.classList.add('is-captured');
        ball.classList.remove('is-shaking', 'is-at-target');
        ball.classList.add('is-success');
        image.classList.remove('is-capture-target', 'is-capture-absorbing');
        image.style.opacity = '0';
        image.style.visibility = 'hidden';
    } else {
        artwork.classList.add('is-escaped');
        ball.classList.remove('is-shaking', 'is-at-target');
        ball.classList.add('is-failed', 'is-opening');
        image.classList.remove('is-capture-target', 'is-capture-absorbing');
        await wait(170);
        image.classList.add('is-capture-escape');
    }

    await wait(result.captured ? 520 : 650);
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
