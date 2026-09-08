export const POKEMON_TYPES = [
    { id: 'normal', name: 'Normal', description: 'Equilibrio, resistencia y versatilidad.' },
    { id: 'fire', name: 'Fuego', description: 'Potencia, intensidad y energía desbordante.' },
    { id: 'water', name: 'Agua', description: 'Fluidez, adaptación y fuerza constante.' },
    { id: 'electric', name: 'Eléctrico', description: 'Velocidad, precisión y energía pura.' },
    { id: 'grass', name: 'Planta', description: 'Naturaleza, crecimiento y regeneración.' },
    { id: 'ice', name: 'Hielo', description: 'Frialdad, control y belleza cristalina.' },
    { id: 'fighting', name: 'Lucha', description: 'Disciplina, fuerza física y determinación.' },
    { id: 'poison', name: 'Veneno', description: 'Toxicidad, desgaste y peligro persistente.' },
    { id: 'ground', name: 'Tierra', description: 'Estabilidad, poder terrestre y contundencia.' },
    { id: 'flying', name: 'Volador', description: 'Libertad, agilidad y dominio del aire.' },
    { id: 'psychic', name: 'Psíquico', description: 'Mente, percepción y poder extraordinario.' },
    { id: 'bug', name: 'Bicho', description: 'Adaptación, instinto y evolución.' },
    { id: 'rock', name: 'Roca', description: 'Defensa, resistencia y fuerza mineral.' },
    { id: 'ghost', name: 'Fantasma', description: 'Misterio, espíritu y fuerzas sobrenaturales.' },
    { id: 'dragon', name: 'Dragón', description: 'Poder ancestral, dominio y grandeza.' },
    { id: 'dark', name: 'Siniestro', description: 'Astucia, estrategia y poder impredecible.' },
    { id: 'steel', name: 'Acero', description: 'Precisión, defensa y fortaleza mecánica.' },
    { id: 'fairy', name: 'Hada', description: 'Encanto, magia y poder inesperado.' }
];

export function getPokemonType(typeId) {
    return POKEMON_TYPES.find(({ id }) => id === typeId) ?? null;
}
