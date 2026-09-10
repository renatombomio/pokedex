import './gamedex-intelligence-advanced.js';

if (!document.querySelector('link[data-gamedex-advanced-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/gamedex-intelligence-advanced.css';
    stylesheet.dataset.gamedexAdvancedStyles = '';
    document.head.appendChild(stylesheet);
}
