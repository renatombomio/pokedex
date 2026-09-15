const TYPE_TRANSLATIONS = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta',
    electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
    ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
    rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
    steel: 'Acero', fairy: 'Hada'
};

export function translateType(type) {
    return TYPE_TRANSLATIONS[type] ?? capitalize(type);
}

export function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatId(id) {
    return String(id).padStart(3, '0');
}

export function getPokemonImage(pokemon) {
    return pokemon.sprites?.other?.['official-artwork']?.front_default
        ?? pokemon.sprites?.front_default
        ?? '';
}
