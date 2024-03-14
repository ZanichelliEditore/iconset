import { Component, html, customElements } from '@chialab/dna';
import { Glyph } from '@chialab/forge';

/**
 * Render a gluph as SVG.
 * @property {Glyph} glyph The glyph to render.
 * @property {boolean} guides Should show guides.
 */
export class GlyphViewer extends Component {
    /**
     * @inheritdoc
     */
    static get observedAttributes() {
        return ['guides'];
    }

    /**
     * @inheritdoc
     */
    static get properties() {
        return {
            glyph: Glyph,
            guides: {
                type: Boolean,
                defaultValue: false,
            },
        };
    }

    /**
     * Download callback.
     * @private
     * @param {Event} event The click event on download button.
     * @return {void}
     */
    download(event) {
        event.stopPropagation();
        event.preventDefault();
        const a = document.createElement('a');
        a.download = `${this.glyph.name}.svg`;
        a.href = this.glyph.toUrl();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * Copy callback.
     * @private
     * @param {Event} event The click event on copy button.
     * @return {void}
     */
    copy(event) {
        event.stopPropagation();
        event.preventDefault();
        navigator.clipboard.writeText(this.glyph.toSVG());
    }

    /**
     * @inheritdoc
     */
    render() {
        if (!this.glyph) {
            return;
        }
        return html`
            <div class="preview-entry__frame">
                ${html(this.glyph.toSVG(false, this.guides))}
            </div>
            <div class="preview-entry__name">
                <span>${this.glyph.name}</span>
            </div>
            <div class="preview-entry__actions">
                <button onclick=${this.copy.bind(this)} tabindex="-1">Copy SVG <i class="icon-copy"></i></button>
                <button onclick=${this.download.bind(this)} tabindex="-1">Download SVG <i class="icon-download"></i></button>
            </div>
        `;
    }
}

customElements.define('glyph-viewer', GlyphViewer);
