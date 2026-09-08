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
        locationAssets: 'assets/regions/kanto/locations',
        locationImages: ['pallet-town', 'viridian-city', 'pewter-city', 'cerulean-city', 'vermilion-city', 'lavender-town', 'celadon-city', 'fuchsia-city', 'saffron-city', 'cinnabar-island', 'indigo-plateau']
    },
    {
        id: 'johto',
        name: 'Johto',
        generation: 'Generación II',
        pokedex: 'original-johto',
        starters: ['chikorita', 'cyndaquil', 'totodile'],
        accent: '#d99b4b',
        description: 'Una región de tradición, leyendas y nuevos Pokémon por descubrir.',
        map: 'assets/regions/johto/map.png',
        locationAssets: 'assets/regions/johto/locations',
        locationImages: ['new-bark-town', 'goldenrod-city', 'ecruteak-city', 'olivine-city', 'blackthorn-city']
    },
    {
        id: 'hoenn',
        name: 'Hoenn',
        generation: 'Generación III',
        pokedex: 'hoenn',
        starters: ['treecko', 'torchic', 'mudkip'],
        accent: '#5d9fe8',
        description: 'Una región marcada por el mar, la naturaleza y grandes aventuras.',
        map: 'assets/regions/hoenn/map.png',
        locationAssets: 'assets/regions/hoenn/locations',
        locationImages: ['littleroot-town', 'dewford-town', 'fallarbor-town', 'slateport-city', 'lilycove-city']
    },
    {
        id: 'sinnoh',
        name: 'Sinnoh',
        generation: 'Generación IV',
        pokedex: 'original-sinnoh',
        starters: ['turtwig', 'chimchar', 'piplup'],
        accent: '#8e8edb',
        description: 'Una tierra antigua donde los mitos y los Pokémon legendarios cobran vida.',
        map: 'assets/regions/sinnoh/map.png',
        locationAssets: 'assets/regions/sinnoh/locations',
        locationImages: ['twinleaf-town', 'jubilife-city', 'hearthome-city', 'veilstone-city', 'snowpoint-city']
    },
    {
        id: 'unova',
        name: 'Teselia / Unova',
        generation: 'Generación V',
        pokedex: 'original-unova',
        starters: ['snivy', 'tepig', 'oshawott'],
        accent: '#b4b8c2',
        description: 'Una región urbana y diversa con una Pokédex completamente nueva.',
        map: 'assets/regions/unova/map.png',
        locationAssets: 'assets/regions/unova/locations',
        locationImages: ['nuvema-town', 'accumula-town', 'nacrene-city', 'nimbasa-city', 'driftveil-city']
    },
    {
        id: 'kalos',
        name: 'Kalos',
        generation: 'Generación VI',
        pokedex: 'kalos-central',
        starters: ['chespin', 'fennekin', 'froakie'],
        accent: '#e66f8f',
        description: 'Una región de belleza, ciudades elegantes y la energía de la megaevolución.',
        map: 'assets/regions/kalos/map.png',
        locationAssets: 'assets/regions/kalos/locations',
        locationImages: ['vaniville-town', 'santalune-city', 'lumiose-city', 'coumarine-city', 'snowbelle-city']
    },
    {
        id: 'alola',
        name: 'Alola',
        generation: 'Generación VII',
        pokedex: 'original-alola',
        starters: ['rowlet', 'litten', 'popplio'],
        accent: '#e8c64c',
        description: 'Un archipiélago tropical donde cada isla tiene su propio carácter.',
        map: 'assets/regions/alola/map.png',
        locationAssets: 'assets/regions/alola/locations',
        locationImages: ['iki-town', 'hauoli-city', 'konikoni-city', 'malie-city', 'seafolk-village']
    },
    {
        id: 'galar',
        name: 'Galar',
        generation: 'Generación VIII',
        pokedex: 'galar',
        starters: ['grookey', 'scorbunny', 'sobble'],
        accent: '#8b7be0',
        description: 'Una región inspirada en el Reino Unido, dominada por estadios y grandes combates.',
        map: 'assets/regions/galar/map.png',
        locationAssets: 'assets/regions/galar/locations',
        locationImages: ['postwick', 'motostoke', 'hammerlocke', 'circhester', 'wyndon']
    },
    {
        id: 'paldea',
        name: 'Paldea',
        generation: 'Generación IX',
        pokedex: 'paldea',
        starters: ['sprigatito', 'fuecoco', 'quaxly'],
        accent: '#e07a4f',
        description: 'Una región abierta para explorar a tu ritmo y descubrir nuevas formas de aventura.',
        map: 'assets/regions/paldea/map.png',
        locationAssets: 'assets/regions/paldea/locations',
        locationImages: ['cabo-poco', 'mesagoza', 'levincia', 'cascarrafa', 'montenevera']
    }
];

export function getRegionById(id) {
    return REGIONS.find((region) => region.id === id) ?? null;
}