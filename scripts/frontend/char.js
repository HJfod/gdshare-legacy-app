class Checkmark extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const s = getCSS("--size-svg");
        this.innerHTML = `<image src='resources/checkmark.svg' width=${s} height=${s} class="svg" />`;
    }
}

customElements.define('c-checkmark', Checkmark);