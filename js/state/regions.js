export const REGIONS = [
    {
        id: 'kanto',
        name: 'Kanto',
        generation: 'Generación I',
        pokedex: 'kanto',
        starters: ['bulbasaur', 'charmander', 'squirtle'],
        accent: '#5fc96b',
        description: 'El comienzo de la aventura y el hogar de los 151 Pokémon originales.',
        map: 'assets/regions/kanto/map.png',
        locationAssets: 'assets/regions/kanto/locations'
    },
    {
        id: 'johto',
        name: 'Johto',
        generation: 'Generación II',
        pokedex: 'original-johto',
        starters: ['chikorita', 'cyndaquil', 'totodile'],
        accent: '#d99b4b',
        description: 'Una región de tradición, leyendas y nuevos Pokémon por descubrir.'
    },
    {
        id: 'hoenn',
        name: 'Hoenn',
        generation: 'Generación III',
        pokedex: 'hoenn',
        starters: ['treecko', 'torchic', 'mudkip'],
        accent: '#5d9fe8',
        description: 'Una región marcada por el mar, la naturaleza y grandes aventuras.'
    },
    {
        id: 'sinnoh',
        name: 'Sinnoh',
        generation: 'Generación IV',
        pokedex: 'original-sinnoh',
        starters: ['turtwig', 'chimchar', 'piplup'],
        accent: '#8e8edb',
        description: 'Una tierra antigua donde los mitos y los Pokémon legendarios cobran vida.'
    },
    {
        id: 'unova',
        name: 'Teselia / Unova',
        generation: 'Generación V',
        pokedex: 'original-unova',
        starters: ['snivy', 'tepig', 'oshawott'],
        accent: '#b4b8c2',
        description: 'Una región urbana y diversa con una Pokédex completamente nueva.'
    },
    {
        id: 'kalos',
        name: 'Kalos',
        generation: 'Generación VI',
        pokedex: 'kalos-central',
        starters: ['chespin', 'fennekin', 'froakie'],
        accent: '#e66f8f',
        description: 'Una región de belleza, ciudades elegantes y la energía de la megaevolución.'
    },
    {
        id: 'alola',
        name: 'Alola',
        generation: 'Generación VII',
        pokedex: 'original-alola',
        starters: ['rowlet', 'litten', 'popplio'],
        accent: '#e8c64c',
        description: 'Un archipiélago tropical donde cada isla tiene su propio carácter.'
    },
    {
        id: 'galar',
        name: 'Galar',
        generation: 'Generación VIII',
        pokedex: 'galar',
        starters: ['grookey', 'scorbunny', 'sobble'],
        accent: '#8b7be0',
        description: 'Una región inspirada en el Reino Unido, dominada por estadios y grandes combates.'
    },
    {
        id: 'paldea',
        name: 'Paldea',
        generation: 'Generación IX',
        pokedex: 'paldea',
        starters: ['sprigatito', 'fuecoco', 'quaxly'],
        accent: '#e07a4f',
        description: 'Una región abierta para explorar a tu ritmo y descubrir nuevas formas de aventura.'
    }
];

export function getRegionById(id) {
    return REGIONS.find((region) => region.id === id) ?? null;
}