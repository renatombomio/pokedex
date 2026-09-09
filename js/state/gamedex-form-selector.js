document.addEventListener('change', (event) => {
    const select = event.target.closest('[data-gamedex-form]');
    if (!select) return;

    const chip = document.querySelector(
        `[data-gamedex-form-chip="${CSS.escape(select.value)}"]`
    );

    chip?.click();
});
