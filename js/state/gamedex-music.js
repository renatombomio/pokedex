const MUSIC_TRACKS = [
    'assets/audio/gamedex-main.mp3',
    'assets/audio/gamedex-search.mp3',
    'assets/audio/gamedex-exploration.mp3',
    'assets/audio/gamedex-battle.mp3'
];

const MUSIC_ENABLED_KEY = 'pokedex-gamedex-music-enabled';
const MUSIC_MUTED_KEY = 'pokedex-gamedex-music-muted';
const MUSIC_TRACK_KEY = 'pokedex-gamedex-music-track';
const MUSIC_POSITION_KEY = 'pokedex-gamedex-music-position';
const MUSIC_VOLUME = 0.35;
const FADE_DURATION = 900;

let currentTrackIndex = 0;
let audio = null;
let fadeTimer = null;
let player = null;
let toggleButton = null;
let playButton = null;
let nextButton = null;

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
        // Ignore storage failures; audio should still work for this session.
    }
}

function getStoredNumber(key, fallback) {
    try {
        const value = Number(localStorage.getItem(key));
        return Number.isFinite(value) ? value : fallback;
    } catch {
        return fallback;
    }
}

function setStoredNumber(key, value) {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // Ignore storage failures; audio should still work for this session.
    }
}

function createPlayer() {
    if (document.querySelector('[data-gamedex-music-player]')) return;

    player = document.createElement('aside');
    player.className = 'gamedex-music-player';
    player.dataset.gamedexMusicPlayer = '';
    player.setAttribute('aria-label', 'Controles de música GameDex');
    player.innerHTML = `
        <button class="gamedex-music-toggle" type="button" data-music-toggle aria-expanded="false" aria-label="Abrir controles de música" title="Abrir controles de música">♪</button>
        <div class="gamedex-music-controls" data-music-controls>
            <button class="gamedex-music-button" type="button" data-music-play aria-label="Reproducir música" title="Reproducir música">▶</button>
            <button class="gamedex-music-button" type="button" data-music-next aria-label="Siguiente canción" title="Siguiente canción">⏭</button>
        </div>
    `;

    document.body.appendChild(player);

    toggleButton = player.querySelector('[data-music-toggle]');
    playButton = player.querySelector('[data-music-play]');
    nextButton = player.querySelector('[data-music-next]');

    toggleButton.addEventListener('click', toggleControls);
    playButton.addEventListener('click', togglePlayback);
    nextButton.addEventListener('click', skipToNextTrack);
}

function createAudio() {
    audio = new Audio(MUSIC_TRACKS[currentTrackIndex]);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = 0;
    audio.muted = getStoredBoolean(MUSIC_MUTED_KEY, false);
    audio.addEventListener('ended', playNextTrack);
    audio.addEventListener('error', handleAudioError);
}

function persistPosition() {
    if (!audio) return;
    setStoredNumber(MUSIC_TRACK_KEY, currentTrackIndex);
    setStoredNumber(MUSIC_POSITION_KEY, audio.currentTime || 0);
    setStoredBoolean(MUSIC_MUTED_KEY, audio.muted);
}

function updatePlayer() {
    if (!player || !audio) return;

    const isPlaying = !audio.paused;
    playButton.textContent = isPlaying ? '⏸' : '▶';
    playButton.setAttribute('aria-label', isPlaying ? 'Pausar música' : 'Reproducir música');
    playButton.title = isPlaying ? 'Pausar música' : 'Reproducir música';

    toggleButton.classList.toggle('is-playing', isPlaying && !audio.muted);
    toggleButton.textContent = '♪';
}

function toggleControls() {
    const isOpen = player.classList.toggle('is-open');
    toggleButton.setAttribute('aria-expanded', String(isOpen));
    toggleButton.setAttribute('aria-label', isOpen ? 'Cerrar controles de música' : 'Abrir controles de música');
    toggleButton.title = isOpen ? 'Cerrar controles de música' : 'Abrir controles de música';
}

function fadeTo(target, duration = FADE_DURATION, onComplete) {
    if (!audio) return;

    window.clearInterval(fadeTimer);
    const start = audio.volume;
    const difference = target - start;
    const startedAt = performance.now();

    fadeTimer = window.setInterval(() => {
        const progress = Math.min((performance.now() - startedAt) / duration, 1);
        audio.volume = Math.max(0, Math.min(1, start + difference * progress));
        if (progress >= 1) {
            window.clearInterval(fadeTimer);
            fadeTimer = null;
            onComplete?.();
        }
    }, 30);
}

async function startPlayback() {
    if (!audio) createAudio();

    try {
        await audio.play();
        fadeTo(MUSIC_VOLUME);
        setStoredBoolean(MUSIC_ENABLED_KEY, true);
        updatePlayer();
    } catch {
        setStoredBoolean(MUSIC_ENABLED_KEY, false);
        updatePlayer();
    }
}

function pausePlayback() {
    if (!audio) return;
    persistPosition();
    fadeTo(0, 350, () => {
        audio.pause();
        updatePlayer();
    });
    setStoredBoolean(MUSIC_ENABLED_KEY, false);
}

function togglePlayback() {
    if (audio?.paused) {
        startPlayback();
    } else {
        pausePlayback();
    }
}

function switchTrack(nextIndex, shouldPlay) {
    if (!audio) createAudio();

    const wasPlaying = !audio.paused;
    const resumePlayback = shouldPlay ?? wasPlaying;
    persistPosition();

    fadeTo(0, FADE_DURATION, () => {
        audio.pause();
        currentTrackIndex = (nextIndex + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
        setStoredNumber(MUSIC_TRACK_KEY, currentTrackIndex);
        setStoredNumber(MUSIC_POSITION_KEY, 0);
        createAudio();
        updatePlayer();
        if (resumePlayback) startPlayback();
    });
}

function playNextTrack() {
    switchTrack(currentTrackIndex + 1, true);
}

function skipToNextTrack() {
    switchTrack(currentTrackIndex + 1);
}

function handleAudioError() {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
    updatePlayer();
}

function restoreAudioState() {
    const savedTrack = getStoredNumber(MUSIC_TRACK_KEY, 0);
    currentTrackIndex = Number.isInteger(savedTrack) && savedTrack >= 0 && savedTrack < MUSIC_TRACKS.length
        ? savedTrack
        : 0;

    createAudio();

    const savedPosition = Math.max(0, getStoredNumber(MUSIC_POSITION_KEY, 0));
    if (savedPosition > 0) {
        const restorePosition = () => {
            if (Number.isFinite(audio.duration) && savedPosition < audio.duration) {
                audio.currentTime = savedPosition;
            }
            audio.removeEventListener('loadedmetadata', restorePosition);
        };
        audio.addEventListener('loadedmetadata', restorePosition);
    }
}

function init() {
    createPlayer();
    restoreAudioState();
    updatePlayer();

    if (getStoredBoolean(MUSIC_ENABLED_KEY, false)) {
        startPlayback();
    }

    window.addEventListener('pagehide', persistPosition);
    window.addEventListener('beforeunload', persistPosition);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
