const CONTEXT_LABELS = {
    home: 'Inicio',
    pokedex: 'Pokédex',
    types: 'Tipos',
    regions: 'Regiones',
    generations: 'Generaciones',
    favorites: 'Favoritos'
};

export function createWorldBreadcrumb(items = []) {
    const nav = document.createElement('nav');
    nav.className = 'world-breadcrumbs';
    nav.setAttribute('aria-label', 'Ruta de navegación');

    const list = document.createElement('ol');
    list.className = 'world-breadcrumbs-list';

    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'world-breadcrumb-item';

        if (index === items.length - 1 || !item.action) {
            const current = document.createElement('span');
            current.className = 'world-breadcrumb-current';
            current.setAttribute('aria-current', 'page');
            current.textContent = item.label;
            li.appendChild(current);
        } else {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'world-breadcrumb-link';
            button.textContent = item.label;
            button.addEventListener('click', item.action);
            li.appendChild(button);
        }

        list.appendChild(li);
    });

    nav.appendChild(list);
    return nav;
}

export function getContextBreadcrumbItems(state) {
    const items = [{ label: 'Mundo Pokémon', action: () => navigateHome() }];

    if (!state) return items;

    const view = state.view;
    if (view === 'region') {
        items.push({ label: 'Regiones', action: () => navigateHash('#regions') });
        items.push({ label: state.contextLabel || formatId(state.region), action: null });
        return items;
    }

    if (view === 'generation') {
        items.push({ label: 'Generaciones', action: () => navigateHash('#generations') });
        items.push({ label: state.contextLabel || `Generación ${state.generation}`, action: null });
        return items;
    }

    if (view === 'type') {
        items.push({ label: 'Tipos', action: () => navigateHash('#types') });
        items.push({ label: state.contextLabel || formatId(state.type), action: null });
        return items;
    }

    if (view === 'pokemon') {
        const context = state.context;
        if (context?.view === 'region') {
            items.push({ label: 'Regiones', action: () => navigateHash('#regions') });
            items.push({
                label: context.label,
                action: () => navigateHash(`#region/${context.id}`)
            });
        } else if (context?.view === 'generation') {
            items.push({ label: 'Generaciones', action: () => navigateHash('#generations') });
            items.push({
                label: context.label,
                action: () => navigateHash(`#generation/${context.id}`)
            });
        } else if (context?.view === 'type') {
            items.push({ label: 'Tipos', action: () => navigateHash('#types') });
            items.push({
                label: context.label,
                action: () => navigateHash(`#type/${context.id}`)
            });
        } else {
            items.push({ label: 'Pokédex', action: () => navigateHash('#pokedex') });
        }
        items.push({ label: state.pokemonLabel || 'Pokémon', action: null });
        return items;
    }

    if (CONTEXT_LABELS[view]) {
        items.push({ label: CONTEXT_LABELS[view], action: null });
    }

    return items;
}

export function mountWorldBreadcrumb(target, items) {
    if (!target) return null;
    target.querySelector('.world-breadcrumbs')?.remove();
    const breadcrumbs = createWorldBreadcrumb(items);
    target.prepend(breadcrumbs);
    return breadcrumbs;
}

function navigateHash(hash) {
    window.location.hash = hash;
}

function navigateHome() {
    window.location.hash = '#pokedex';
}

function formatId(value = '') {
    return String(value)
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
