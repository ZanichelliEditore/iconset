import { window, render, html } from 'http://unpkg.com/@chialab/dna?module';
import { GlyphsExplorer } from './components/glyphs-explorer/glyphs-explorer.js';
import { FAMILIES } from './config/families.js';

/**
 * Check if the tool is open inside an iframe.
 * @return {boolean}
 */
function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

/**
 * Extract font family name from url hash.
 * @return {string}
 */
function getFamilyFromHash() {
    return location.hash ?
        decodeURIComponent(location.hash.substring(3)) :
        null;
}

const app = window.app = render(html`<${GlyphsExplorer}
    title="Zanichelli Iconset"
    referenceLink="https://zeroheight.com/485b31545/p/95dcdb-albe"
    embed=${inIframe()}
    selectable=${!inIframe()}
    families=${FAMILIES}
    familyName=${getFamilyFromHash() || FAMILIES[0].name}
/>`, window.document.body);

app.addEventListener('change', ({ detail }) => {
    const familyName = detail && detail.newValue;
    if (!familyName) {
        return;
    }
    location.hash = `!/${encodeURIComponent(familyName)}`;
});

window.addEventListener('hashchange', () => {
    app.familyName = getFamilyFromHash();
}, false);
