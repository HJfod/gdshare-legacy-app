class Char extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const s = getCSS("--size-svg");
        this.innerHTML = `<image src='resources/${this.getAttribute("a")}.svg' width=${s} height=${s} class="svg" />`;
    }
}

class Dot extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `•`;
    }
}

customElements.define('c-h', Char);
customElements.define('c-d', Dot);