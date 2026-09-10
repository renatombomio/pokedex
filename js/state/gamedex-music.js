const MUSIC_TRACKS = [
    'assets/audio/gamedex-main.mp3',
    'assets/audio/gamedex-search.mp3',
    'assets/audio/gamedex-exploration.mp3',
    'assets/audio/gamedex-battle.mp3'
];

const MUSIC_VOLUME_KEY = 'pokedex-gamedex-music-volume';
const MUSIC_ENABLED_KEY = 'pokedex-gamedex-music-enabled';
const FADE_DURATION = 900;

let currentTrackIndex = 0;
let audio = null;
let fadeTimer = null;
let player = null;
let playButton = null;
let muteButton = null;
let volumeInput = null;
let volumeValue = null;

function getStoredBoolean(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value === 'true';
    } catch {
        return fallback;
    }
}

function getStoredVolume() {
    try {
        const value = Number(localStorage.getItem(MUSIC_VOLUME_KEY));
        return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0.25;
    } catch {
        return 0.25;
    }
}

function setStoredBoolean(key, value) {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // Ignore storage failures; audio should still work for this session.
    }
}

function setStoredVolume(value) {
    try {
        localStorage.setItem(MUSIC_VOLUME_KEY, String(value));
    } catch {
        // Ignore storage failures; audio should still work for this session.
    }
}

function createPlayer() {
    if (document.querySelector('[data-gamedex-music-player]')) return;

    player = document.createElement('aside');
    player.className = 'gamedex-music-player';
    player.dataset.gamedexMusicPlayer = '';
    player.setAttribute('aria-label', 'Reproductor de música');
    player.innerHTML = `
        <button class="gamedex-music-button" type="button" data-music-play aria-label="Reproducir música" title="Reproducir música">▶</button>
        <div class="gamedex-music-info" aria-live="polite">
            <span>Música GameDex</span>
            <strong data-music-track>Track 1</strong>
        </div>
        <button class="gamedex-music-button gamedex-music-mute" type="button" data-music-mute aria-label="Silenciar música" title="Silenciar música">🔊</button>
        <label class="gamedex-music-volume-label" aria-label="Volumen de música">
            <span class="sr-only">Volumen</span>
            <input data-music-volume type="range" min="0" max="1" step="0.01" value="0.25">
        </label>
    `;

    document.body.appendChild(player);

    playButton = player.querySelector('[data-music-play]');
    muteButton = player.querySelector('[data-music-mute]');
    volumeInput = player.querySelector('[data-music-volume]');
    volumeValue = player.querySelector('[data-music-track]');

    const storedVolume = getStoredVolume();
    volumeInput.value = String(storedVolume);

    playButton.addEventListener('click', togglePlayback);
    muteButton.addEventListener('click', toggleMute);
    volumeInput.addEventListener('input', handleVolumeChange);
}

function createAudio() {
    audio = new Audio(MUSIC_TRACKS[currentTrackIndex]);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = 0;
    audio.addEventListener('ended', playNextTrack);
    audio.addEventListener('error', handleAudioError);
}

function updatePlayer() {
    if (!player || !audio) return;

    const isPlaying = !audio.paused;
    playButton.textContent = isPlaying ? '⏸' : '▶';
    playButton.setAttribute('aria-label', isPlaying ? 'Pausar música' : 'Reproducir música');
    playButton.title = isPlaying ? 'Pausar música' : 'Reproducir música';

    const muted = audio.muted || Number(volumeInput.value) === 0;
    muteButton.textContent = muted ? '🔇' : '🔊';
    muteButton.setAttribute('aria-label', muted ? 'Activar música' : 'Silenciar música');
    muteButton.title = muted ? 'Activar música' : 'Silenciar música';

    volumeValue.textContent = `Track ${currentTrackIndex + 1}`;
}

function getTargetVolume() {
    return Number(volumeInput?.value ?? getStoredVolume());
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
        fadeTo(getTargetVolume());
        setStoredBoolean(MUSIC_ENABLED_KEY, true);
        updatePlayer();
    } catch {
        // Browsers may block playback until the user interacts with the page.
        setStoredBoolean(MUSIC_ENABLED_KEY, false);
        updatePlayer();
    }
}

function pausePlayback() {
    if (!audio) return;
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

function toggleMute() {
    if (!audio) createAudio();
    audio.muted = !audio.muted;
    updatePlayer();
}

function handleVolumeChange(event) {
    const value = Number(event.target.value);
    setStoredVolume(value);
    if (!audio) createAudio();
    if (value > 0 && audio.muted) audio.muted = false;
    audio.volume = value;
    updatePlayer();
}

function playNextTrack() {
    if (!audio) return;

    fadeTo(0, FADE_DURATION, () => {
        audio.pause();
        currentTrackIndex = (currentTrackIndex + 1) % MUSIC_TRACKS.length;
        createAudio();
        startPlayback();
    });
}

function handleAudioError() {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
    updatePlayer();
}

function init() {
    createPlayer();
    createAudio();
    updatePlayer();

    // Attempt background playback when the saved preference allows it.
    // If the browser blocks autoplay, the player remains available for a manual click.
    if (getStoredBoolean(MUSIC_ENABLED_KEY, false)) {
        startPlayback();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
