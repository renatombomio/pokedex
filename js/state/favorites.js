import { getPokemon } from '../api/pokemon.js';
import { loadPokemonDetails } from './details.js';
import { renderPokemonDetails } from './ui.js';

const STORAGE_KEY = 'pokedex-favorites';
const pokemonCache = new Map();

const favoritesSection = document.querySelector('#favorites');
const pokemonGrid = document.querySelector('#pokemon-grid');
const detailContent = document.querySelector('#detail-content');

let favoriteIds = loadFavorites();

function loadFavorites() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(stored)
            ? stored.map(Number).filter(Number.isInteger)
            : [];
    } catch {
        return [];
    }
}

function saveFavorites() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
}

function isFavorite(id) {
    return favoriteIds.includes(Number(id));
}

function toggleFavorite(id) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId)) {
        return;
    }

    if (isFavorite(numericId)) {
        favoriteIds = favoriteIds.filter((favoriteId) => favoriteId !== numericId);
    } else {
        favoriteIds = [...favoriteIds, numericId];
    }

    saveFavorites();
    syncFavoriteButtons();
    renderFavorites();
}

function syncFavoriteButtons() {
    document.querySelectorAll('.favorite-toggle').forEach((button) => {
        const id = Number(button.dataset.pokemonId);
        const active = isFavorite(id);

        button.classList.toggle('is-favorite', active);
        button.setAttribute('aria-pressed', String(active));
        button.setAttribute(
            'aria-label',
            active ? 'Quitar de favoritos' : 'Añadir a favoritos'
        );
        button.textContent = active ? '♥' : '♡';
    });
}

function createFavoriteButton(id) {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'favorite-toggle';
    button.dataset.pokemonId = id;
    button.setAttribute('aria-pressed', String(isFavorite(id)));
    button.setAttribute('aria-label', isFavorite(id) ? 'Quitar de favoritos' : 'Añadir a favoritos');
    button.textContent = isFavorite(id) ? '♥' : '♡';

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(id);
    });

    return button;
}

function injectFavoriteButtons(root = document) {
    root.querySelectorAll('.pokemon-card:not([data-favorite-ready])').forEach((card) => {
        const id = Number(card.dataset.pokemonId);

        if (!Number.isInteger(id)) {
            return;
        }

        card.dataset.favoriteReady = 'true';
        card.style.position = 'relative';
        card.appendChild(createFavoriteButton(id));
    });

    const detailHero = root.querySelector('.detail-hero:not([data-favorite-ready])');

    if (detailHero) {
        const numberElement = detailHero.querySelector('.detail-number');
        const id = Number.parseInt(numberElement?.textContent || '', 10);

        if (Number.isInteger(id)) {
            detailHero.dataset.favoriteReady = 'true';
            detailHero.appendChild(createFavoriteButton(id));
        }
    }

    syncFavoriteButtons();
}

function getImage(pokemon) {
    return (
        pokemon.sprites?.other?.['official-artwork']?.front_default ||
        pokemon.sprites?.front_default ||
        ''
    );
}

const typeTranslations = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
    grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
    ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
    rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
    steel: 'Acero', fairy: 'Hada'
};

function createCard(pokemon) {
    const article = document.createElement('article');

    article.className = 'pokemon-card';
    article.dataset.pokemonId = pokemon.id;

    article.innerHTML = `
        <button class="pokemon-card-button" type="button">
            <div class="pokemon-card-image">
                <span class="pokemon-number">#${String(pokemon.id).padStart(3, '0')}</span>
                <img src="${getImage(pokemon)}" alt="${pokemon.name}" loading="lazy">
            </div>
            <div class="pokemon-card-content">
                <h3>${pokemon.name}</h3>
                <div class="pokemon-types">
                    ${pokemon.types.map(({ type }) => `
                        <span class="pokemon-type type-${type.name}">${typeTranslations[type.name] || type.name}</span>
                    `).join('')}
                </div>
            </div>
        </button>
    `;

    return article;
}

async function getFavoritePokemon(id) {
    if (!pokemonCache.has(id)) {
        pokemonCache.set(id, getPokemon(id));
    }

    return pokemonCache.get(id);
}

async function openFavoriteDetail(id) {
    try {
        const details = await loadPokemonDetails(id);
        renderPokemonDetails(details);
    } catch (error) {
        console.error('Could not load favorite details:', error);
    }
}

async function renderFavorites() {
    if (!favoritesSection) {
        return;
    }

    let grid = favoritesSection.querySelector('.favorites-grid');
    let empty = favoritesSection.querySelector('.favorites-empty');

    if (!grid) {
        grid = document.createElement('div');
        grid.className = 'favorites-grid';
        favoritesSection.querySelector('.container').appendChild(grid);
    }

    if (!empty) {
        empty = document.createElement('div');
        empty.className = 'favorites-empty';
        empty.innerHTML = `
            <div class="favorites-empty-icon" aria-hidden="true">♡</div>
            <strong>Aún no tienes favoritos</strong>
            <p>Guarda un Pokémon con el corazón y aparecerá aquí para que puedas volver a él rápidamente.</p>
        `;
        favoritesSection.querySelector('.container').appendChild(empty);
    }

    if (!favoriteIds.length) {
        grid.replaceChildren();
        empty.hidden = false;
        favoritesSection.classList.remove('has-favorites');
        return;
    }

    const results = await Promise.allSettled(
        favoriteIds.map((id) => getFavoritePokemon(id))
    );

    const validPokemon = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

    grid.replaceChildren(...validPokemon.map(createCard));
    empty.hidden = validPokemon.length > 0;
    favoritesSection.classList.toggle('has-favorites', validPokemon.length > 0);
    injectFavoriteButtons(grid);
}

if (favoritesSection) {
    favoritesSection.addEventListener('click', (event) => {
        const card = event.target.closest('.favorites-grid .pokemon-card');

        if (!card || event.target.closest('.favorite-toggle')) {
            return;
        }

        openFavoriteDetail(card.dataset.pokemonId);
    });
}

if (pokemonGrid) {
    const observer = new MutationObserver(() => {
        injectFavoriteButtons(pokemonGrid);
    });

    observer.observe(pokemonGrid, { childList: true, subtree: true });
}

if (detailContent) {
    const observer = new MutationObserver(() => {
        injectFavoriteButtons(detailContent);
    });

    observer.observe(detailContent, { childList: true, subtree: true });
}

renderFavorites();
injectFavoriteButtons();
