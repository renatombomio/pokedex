const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');


if (menuButton && navigation) {

    navigation.id = 'main-navigation';

    menuButton.addEventListener('click', () => {
        const isOpen =
            menuButton.getAttribute('aria-expanded') === 'true';

        menuButton.setAttribute(
            'aria-expanded',
            String(!isOpen)
        );

        navigation.classList.toggle(
            'is-open',
            !isOpen
        );
    });

    navigation.addEventListener('click', (event) => {
        if (!event.target.closest('a')) {
            return;
        }

        menuButton.setAttribute(
            'aria-expanded',
            'false'
        );

        navigation.classList.remove('is-open');
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }

        menuButton.setAttribute(
            'aria-expanded',
            'false'
        );

        navigation.classList.remove('is-open');
    });
}
