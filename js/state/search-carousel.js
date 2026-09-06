const modal = document.querySelector('.search-modal');

if (modal) {
    initializeSearchCarousel(modal);
}

function initializeSearchCarousel(searchModal) {
    const header = searchModal.querySelector(
        '.search-modal-header'
    );

    const results = searchModal.querySelector(
        '.search-modal-results'
    );

    if (!header || !results) {
        return;
    }

    const controls = document.createElement('div');
    controls.className = 'search-carousel-controls';
    controls.innerHTML = `
        <span
            class="search-carousel-position"
            aria-live="polite"
        ></span>

        <div class="search-carousel-buttons">
            <button
                class="search-carousel-button"
                type="button"
                data-carousel-direction="previous"
                aria-label="Resultados anteriores"
            >
                <span aria-hidden="true">←</span>
            </button>

            <button
                class="search-carousel-button"
                type="button"
                data-carousel-direction="next"
                aria-label="Resultados siguientes"
            >
                <span aria-hidden="true">→</span>
            </button>
        </div>
    `;

    header.appendChild(controls);

    const position = controls.querySelector(
        '.search-carousel-position'
    );

    const previousButton = controls.querySelector(
        '[data-carousel-direction="previous"]'
    );

    const nextButton = controls.querySelector(
        '[data-carousel-direction="next"]'
    );

    function getCardStep() {
        const card = results.firstElementChild;

        if (!card) {
            return 0;
        }

        const styles = window.getComputedStyle(results);
        const gap = parseFloat(styles.columnGap) || 0;

        return card.getBoundingClientRect().width + gap;
    }

    function getVisibleCards() {
        const step = getCardStep();

        if (!step) {
            return 1;
        }

        return Math.max(
            1,
            Math.round(results.clientWidth / step)
        );
    }

    function updateCarousel() {
        const cards = [
            ...results.children
        ];

        const total = cards.length;
        const step = getCardStep();

        if (!total || !step) {
            controls.hidden = true;
            return;
        }

        controls.hidden = false;

        const visible = Math.min(
            getVisibleCards(),
            total
        );

        const maxStart = Math.max(
            0,
            total - visible
        );

        const currentStart = Math.min(
            maxStart,
            Math.max(
                0,
                Math.round(
                    results.scrollLeft / step
                )
            )
        );

        const currentEnd = Math.min(
            total,
            currentStart + visible
        );

        position.textContent =
            `${currentStart + 1}–${currentEnd} de ${total}`;

        previousButton.disabled =
            currentStart <= 0;

        nextButton.disabled =
            currentStart >= maxStart;
    }

    function scrollCarousel(direction) {
        const step = getCardStep();

        if (!step) {
            return;
        }

        const amount =
            step * getVisibleCards();

        results.scrollBy({
            left:
                direction === 'next'
                    ? amount
                    : -amount,
            behavior: 'smooth'
        });
    }

    previousButton.addEventListener(
        'click',
        () => scrollCarousel('previous')
    );

    nextButton.addEventListener(
        'click',
        () => scrollCarousel('next')
    );

    results.addEventListener(
        'scroll',
        updateCarousel,
        { passive: true }
    );

    window.addEventListener(
        'resize',
        updateCarousel
    );

    const observer = new MutationObserver(() => {
        results.scrollTo({
            left: 0,
            behavior: 'auto'
        });

        requestAnimationFrame(
            updateCarousel
        );
    });

    observer.observe(results, {
        childList: true
    });

    requestAnimationFrame(
        updateCarousel
    );
}
