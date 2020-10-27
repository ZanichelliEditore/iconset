import { Component, html, customElements } from 'https://unpkg.com/@chialab/dna?module';
import { Font } from 'https://unpkg.com/@chialab/forge?module';
import '../glyph-viewer/glyph-viewer.js';

/**
 * A viewer for font's glyphs.
 * @property {Font} font The font model.
 * @property {Object} variation The font variation descriptor.
 * @property {Array<Glyph>} glyphs The full list of glyphs.
 * @property {string} query The filter query.
 * @property {boolean} filterable Enable glyphs filtering.
 * @property {boolean} selectable Enable glyphs selection.
 * @property {boolean} guides Show guides.
 * @property {Array<Glyph>} selection A list of selected glyphs.
 */
export class GlyphsViewer extends Component {
    /**
     * @inheritdoc
     */
    static get observedAttributes() {
        return ['selectable', 'filterable', 'guides'];
    }

    /**
     * @inheritdoc
     */
    static get listeners() {
        return {
            'input [name="search"]': this.prototype.updateFilter,
            'change [name="search"]': this.prototype.updateFilter,
            'click .preview-entry': this.prototype.select,
        };
    }

    /**
     * @inheritdoc
     */
    static get properties() {
        return {
            font: {
                type: Font,
                observe() {
                    this.load(true);
                },
            },
            variation: {
                type: Object,
                observe() {
                    this.load();
                },
            },
            glyphs: {
                type: Array,
                defaultValue: [],
            },
            query: {
                type: [String, RegExp],
            },
            filterable: {
                type: Boolean,
                defaultValue: false,
            },
            selectable: {
                type: Boolean,
                defaultValue: false,
            },
            guides: {
                type: Boolean,
                defaultValue: false,
            },
            selection: {
                type: Array,
                event: true,
                defaultValue: [],
            },
        };
    }

    /**
     * Load the list of glyphs for the selected font.
     * @param {boolean} force Force loading.
     * @return {void}
     * @private
     */
    load(force) {
        if (force) {
            this.selection = [];
            this.variation = null;
        }
        if (!this.font) {
            this.glyphs = null;
            return;
        }
        this.glyphs = this.font.getGlyphs(this.variation)
            .filter((glyph) => glyph.path.toSVG() !== '<path d=""/>');
    }

    /**
     * Update the query string filter.
     * @param {Event} event The change event.
     * @param {HTMLElement} input The filtet input.
     * @return {void}
     * @private
     */
    updateFilter(event, input) {
        this.query = input.value.toLowerCase();
    }

    /**
     * Add a glyph to the selection.
     * @param {Event} event The click event.
     * @param {HTMLElement} target The clicked glyph element.
     * @return {void}
     * @private
     */
    select(event, target) {
        event.stopPropagation();
        event.preventDefault();

        const name = target.id;
        let io = this.selection.indexOf(name);
        if (io !== -1) {
            this.selection.splice(io, 1);
        } else {
            this.selection.push(name);
        }

        this.selection = this.selection.slice(0);
    }

    /**
     * @inheritdoc
     */
    render() {
        const glyphs = this.glyphs && this.glyphs
            .filter((glyph) => glyph.unicode != null)
            .filter((glyph) => !this.query || glyph.name.includes(this.query)) || [];

        return html`
            ${this.filterable && html`<div class="filters">
                <div class="search-filter">
                    <input name="search" type="search" placeholder="Filter by name" />
                    ${!this.query && html`<i class="icon-search"></i>`}
                </div>
            </div>`}
            <div class="preview-grid">
                ${glyphs.map((glyph) => html`
                    <button class="preview-entry" id=${glyph.name} data-selected=${this.selection.includes(glyph.name)} disabled=${!this.selectable}>
                        <glyph-viewer glyph=${glyph} guides=${this.guides}></glyph-viewer>
                    </button>
                `)}
            </div>
        `;
    }
}

customElements.define('glyphs-viewer', GlyphsViewer);
