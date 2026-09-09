export const GENERATIONS = [
    { id: 1, name: 'Generación I', shortName: 'I', region: 'Kanto', start: 1, end: 151, starters: ['bulbasaur', 'charmander', 'squirtle'], description: 'El origen de la Pokédex y las 151 especies que comenzaron la aventura.' },
    { id: 2, name: 'Generación II', shortName: 'II', region: 'Johto', start: 152, end: 251, starters: ['chikorita', 'cyndaquil', 'totodile'], description: 'Nuevas especies, nuevos misterios y el viaje continúa más allá de Kanto.' },
    { id: 3, name: 'Generación III', shortName: 'III', region: 'Hoenn', start: 252, end: 386, starters: ['treecko', 'torchic', 'mudkip'], description: 'Una nueva aventura marcada por el mar, la naturaleza y Pokémon inéditos.' },
    { id: 4, name: 'Generación IV', shortName: 'IV', region: 'Sinnoh', start: 387, end: 493, starters: ['turtwig', 'chimchar', 'piplup'], description: 'Una generación de mitos antiguos, leyendas y una Pokédex ampliada.' },
    { id: 5, name: 'Generación V', shortName: 'V', region: 'Teselia / Unova', start: 494, end: 649, starters: ['snivy', 'tepig', 'oshawott'], description: 'Una nueva Pokédex regional que presenta una generación completamente nueva.' },
    { id: 6, name: 'Generación VI', shortName: 'VI', region: 'Kalos', start: 650, end: 721, starters: ['chespin', 'fennekin', 'froakie'], description: 'La era de Kalos, la megaevolución y nuevas formas de combatir.' },
    { id: 7, name: 'Generación VII', shortName: 'VII', region: 'Alola', start: 722, end: 809, starters: ['rowlet', 'litten', 'popplio'], description: 'Una generación insular con nuevas tradiciones, formas regionales y aventuras.' },
    { id: 8, name: 'Generación VIII', shortName: 'VIII', region: 'Galar', start: 810, end: 905, starters: ['grookey', 'scorbunny', 'sobble'], description: 'Grandes estadios, nuevas especies y la energía de una región moderna.' },
    { id: 9, name: 'Generación IX', shortName: 'IX', region: 'Paldea', start: 906, end: 1025, starters: ['sprigatito', 'fuecoco', 'quaxly'], description: 'Una generación abierta a la exploración con nuevas especies y aventuras.' }
];

export function getGenerationById(id) {
    return GENERATIONS.find((generation) => generation.id === Number(id)) ?? null;
}
