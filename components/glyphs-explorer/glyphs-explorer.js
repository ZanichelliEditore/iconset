import { customElements, Component, html } from 'https://unpkg.com/@chialab/dna?module';
import { Font, load } from 'https://unpkg.com/@chialab/forge?module';
import '../glyphs-editor/glyphs-editor.js';

/**
 * Render a full list of font's glyphs.
 * @property {string} title The title of explorer.
 * @property {boolean} menu The menu visibility state.
 * @property {boolean} embed Enable embed mode.
 * @property {boolean} filterable Enable glyphs filtering.
 * @property {boolean} selectable Enable glyphs selection.
 * @property {boolean} guides Show guides.
 * @property {Array<string>} families A list of family names.
 * @property {string} familyName The selected family name.
 * @property {Font} font The selected font model.
 * @property {string} referenceLink A reference link of the tool.
 */
export class GlyphsExplorer extends Component {
    /**
     * @inheritdoc
     */
    static get observedAttributes() {
        return ['title', 'menu', 'embed', 'guides'];
    }

    /**
     * @inheritdoc
     */
    static get listeners() {
        return {
            'click nav [data-name]': this.prototype.selectFontFamily,
            'click .menu': this.prototype.toggleMenu,
        };
    }

    /**
     * @inheritdoc
     */
    static get properties() {
        return {
            title: String,
            menu: {
                type: Boolean,
                defaultValue: false,
            },
            embed: {
                type: Boolean,
                defaultValue: false,
            },
            selectable: {
                type: Boolean,
                defaultValue: true,
            },
            filterable: {
                type: Boolean,
                defaultValue: true,
            },
            guides: {
                type: Boolean,
                defaultValue: false,
            },
            families: {
                type: Array,
                defaultValue: [],
            },
            familyName: {
                type: String,
                event: 'change',
                observe(oldFamily, newFamily) {
                    this.loadFont(newFamily);
                },
            },
            font: {
                type: Font,
                event: 'load',
            },
            referenceLink: String,
        };
    }

    /**
     * Toggle menu on mobile.
     * @return {void}
     * @private
     */
    toggleMenu() {
        this.menu = !this.menu;
    }

    /**
     * Select a font family from the list.
     * @property {Event} event The click event.
     * @property {HTMLButtonElement} button The button trigger.
     * @return {void}
     * @private
     */
    selectFontFamily(event, button) {
        event.stopPropagation();
        event.preventDefault();
        this.menu = false;
        this.familyName = button.dataset.name;
    }

    /**
     * Load font model by family name.
     * @property {string} familyName The name of the font to load.
     * @return {void}
     * @private
     */
    async loadFont(familyName) {
        this.font = null;
        let family = this.families.find(({ name }) => name === familyName);
        if (!family || !family.url) {
            return;
        }

        this.font = await load(family.url);
    }

    /**
     * @inheritdoc
     */
    render() {
        return html`
            <div class="head">
                ${this.title && !this.embed && html`<h1>${this.title}</h1>`}
                <nav>
                    ${this.families.map((family) => html`<button class="font-family" data-name=${family.name} data-selected=${this.familyName === family.name}><span>${family.name}</span></button>`)}
                    ${this.referenceLink && !this.embed && html`<a href="${this.referenceLink}" target="_blank"><span>Documentation <i class="icon-external"></i></span></a>`}
                    ${this.embed && html`<a href=${location.href} target="_blank"><span>Open the tool <i class="icon-external"></i></span></a>`}
                </nav>
                ${!this.embed && html`<button class="menu"><i class="icon-menu"></i></button>`}
            </div>
            <glyphs-editor name=${this.familyName} font=${this.font} selectable=${this.selectable} filterable=${this.filterable} guides=${this.guides}></glyphs-editor>
        `;
    }
}

customElements.define('glyphs-explorer', GlyphsExplorer);
