import { Component, html, customElements } from 'https://unpkg.com/@chialab/dna?module';
import { Font } from 'https://unpkg.com/@chialab/forge@1.0.3/dist/esm/forge.js';
import { GlyphsViewer } from '../glyphs-viewer/glyphs-viewer.js';

/**
 * @typedef {Object} FileDescription
 * @param {string} name The file name.
 * @param {string} content The file content.
 */

/**
 * Convert family name into valid file name.
 * @param {string} familyName The name to convert.
 * @return {string}
 */
function familyNameToFileName(familyName) {
    return familyName.replace(/\s+/g, '-').toLowerCase();
}

/**
 * A viewer for editing glyphs of a font.
 * @property {string} name The name of the font.
 * @property {Font} font The font model.
 * @property {Object} variation The font variation descriptor.
 * @property {number} weight The weight value for the font.
 * @property {number} minWeight The minimum weight value for the font.
 * @property {number} maxWeight The maximum weight value for the font.
 * @property {number} weightStep The step of weight range input.
 * @property {boolean} filterable Enable glyphs filtering.
 * @property {boolean} selectable Enable glyphs selection.
 * @property {boolean} guides Show guides.
 * @property {Array<Glyph>} selection A list of selected glyphs.
 */
export class GlyphsEditor extends Component {
    /**
     * @inheritdoc
     */
    static get observedAttributes() {
        return ['name', 'selectable', 'filterable', 'guides'];
    }

    /**
     * @inheritdoc
     */
    static get listeners() {
        return {
            'input [name="weight"]': this.prototype.onWeightChanged,
            'change [name="weight"]': this.prototype.onWeightChanged,
            'selectionchange'() {
                this.selection = this.viewer.selection;
            },
        };
    }

    /**
     * @inheritdoc
     */
    static get properties() {
        return {
            name: String,
            font: {
                type: Font,
                observe: GlyphsEditor.prototype.onFontChanged,
            },
            variation: Object,
            weight: {
                type: Number,
                observe: GlyphsEditor.prototype.onVariationChanged,
            },
            minWeight: Number,
            maxWeight: Number,
            weightStep: Number,
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
                defaultValue: [],
            },
        };
    }

    /**
     * The viewer instance.
     * @private
     */
    viewer = new GlyphsViewer();

    /**
     * Load JSZIP module and resolve the constructor.
     * @private
     * @return {Promise<Function>}
     */
    loadJSZIP() {
        if (!this._loadJSZIPPromise) {
            this._loadJSZIPPromise = Promise.resolve()
                .then(async () => {
                    const exports = window.exports = {};
                    const module = window.module = { exports };
                    await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js');
                    const JSZIP = module.exports;
                    delete window.exports;
                    delete window.module;
                    return JSZIP;
                });
        }
        
        return this._loadJSZIPPromise;
    }

    /**
     * Update the interface for the loaded font.
     * @private
     * @return {void}
     */
    onFontChanged() {
        if (!this.font) {
            this.weight = undefined;
            this.minWeight = undefined;
            this.maxWeight = undefined;
            return;
        }

        let weightVariation = this.font.getAxes()?.find(({ tag }) => tag === 'wght') || {};
        this.weight = weightVariation.defaultValue;
        this.minWeight = weightVariation.minValue;
        this.maxWeight = weightVariation.maxValue;
    }

    /**
     * Update selected font variation.
     * @private
     * @return {void}
     */
    onVariationChanged() {
        let settings = {};
        if (this.weight !== undefined) {
            settings.wght = this.weight;
        }
        this.variation = Object.keys(settings).length ? settings : null;
    }

    /**
     * Update selected font weight.
     * @private
     * @param {Event} event The input change event.
     * @param {HTMLElement} input The input element.
     * @return {void}
     */
    onWeightChanged(event, input) {
        this.weight = parseFloat(input.value);
    }

    /**
     * Archive files in a zip file.
     * @param {FileDescription[]} files A list of files to archive.
     * @return {Promise<void>}
     */
    async archive(files) {
        const JSZIP = await this.loadJSZIP();

        let zip = new JSZIP();
        files.forEach(({ name, content }) => {
            zip.file(name, content);
        });
        return zip;
    }

    /**
     * Trigger file download.
     * @return {void}
     */
    download(blob, name) {
        let a = document.createElement('a');
        a.download = name;
        a.href = URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * Download selected glyphs as SVG.
     * @return {void}
     */
    async downloadSelectedSVG() {
        let fileName = familyNameToFileName(this.name);
        let font = this.variation ? this.font.getVariation(this.variation) : this.font;
        let svgs = font.toSVG(this.selection);
        let zip = await this.archive(svgs);
        let blob = await zip.generateAsync({ type: 'blob' });
        return this.download(blob, `${fileName}.zip`);
    }

    /**
     * Download selected font as SVG files.
     * @return {void}
     */
    async downloadFullSVG() {
        let fileName = familyNameToFileName(this.name);
        let font = this.variation ? this.font.getVariation(this.variation) : this.font;
        let svgs = font.toSVG();
        let zip = await this.archive(svgs);
        let blob = await zip.generateAsync({ type: 'blob' });
        return this.download(blob, `${fileName}.zip`);
    }

    /**
     * Download selected font as TTF.
     * @return {void}
     */
    async downloadAsTTF() {
        let fileName = familyNameToFileName(this.name);
        let font = this.variation ? this.font.getVariation(this.variation) : this.font;
        return this.download(font.toBlob(), `${fileName}.ttf`);
    }

    /**
     * Download selected font as web font.
     * @return {void}
     */
    async downloadAsWebFont() {
        let fileName = familyNameToFileName(this.name);
        let dir = 'fonts';
        let font = this.variation ? this.font.getVariation(this.variation) : this.font;
        let { css: fontFace, files } = font.toCSSFontFace(this.name, dir, ['woff']);
        let cssClasses = font.toCSS(this.name);
        let zip = await this.archive([
            {
                name: 'fontface.css',
                content: fontFace,
            },
            {
                name: 'style.css',
                content: `${fontFace}\n${cssClasses}`,
            },
            ...files,
        ]);
        let blob = await zip.generateAsync({ type: 'blob' });
        return this.download(blob, `${fileName}.zip`);
    }

    /**
     * @inheritdoc
     */
    render() {
        return html`
            <div class="tools">
                ${this.weight !== undefined && html`<div class="tool">
                    <label for="weight">Weight</label>
                    <input id="weight" name="weight" type="range"
                        min=${this.minWeight}
                        max=${this.maxWeight}
                        step=${(this.maxWeight - this.minWeight) / 10}
                        value=${this.weight} />
                    <div class="legend">
                        <span>Light</span>
                        <span>Regular</span>
                        <span>Bold</span>
                    </div>
                </div>`}
                <div class="actions">
                    ${this.selectable && html`<button onclick=${() => this.downloadSelectedSVG()} disabled=${!this.selection || !this.selection.length}>Download selected</button>`}
                    <button onclick=${() => this.downloadFullSVG()}>Download SVG files</button>
                    <button onclick=${() => this.downloadAsTTF()}>Download as .ttf</button>
                    <button onclick=${() => this.downloadAsWebFont()}>Download as Web Font</button>
                </div>
            </div>
            <${this.viewer} variation=${this.variation} font=${this.font} selectable=${this.selectable} filterable=${this.filterable} guides=${this.guides} class="preview" />
        `;
    }
}

customElements.define('glyphs-editor', GlyphsEditor);
