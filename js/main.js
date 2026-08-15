import { getPokemon } from './api/pokemon.js';

async function init() {
    try {
        const pokemon = await getPokemon('pikachu');

        console.log(pokemon);
    } catch (error) {
        console.error(error);
    }
}

init();