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

class DevT extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `<c-d></c-d> ${this.innerHTML}`;
        this.devInfo = {
            HJfod: { name: "HJfod", tag: "#1795", desc: "Main developer", links: [
                [ "YouTube", "https://youtube.com/hjfod" ],
                [ "Twitter", "https://twitter.com/hjfod"]
            ]},
            GDColon: { name: "GDColon", tag: "#0206", desc: "Backend base codes", links: [
                [ "YouTube", "https://www.youtube.com/channel/UCFDsxSlQXpLLpVScy2NmbcQ" ],
                [ "Twitter", "https://twitter.com/TheRealGDColon" ]
            ]},
            Mercury: { name: "Mercury", tag: "#9776", desc: "PR guy", links: [
                [ "YouTube", "https://www.youtube.com/channel/UCVs0uwKdPbIv0VjMvZAYM4Q" ]
            ]},
            Simonoson: { name: "Simonoson", tag: "#3939", desc: "Initial concept", links: [
                [ "Twitter", "https://twitter.com/simonoson" ]
            ]}
        };
        this.addEventListener("click", () => {
            const dev = this.devInfo[this.getAttribute("i")];
            let l = "";
            dev.links.forEach(e => l += `<c-d></c-d> <hyper-link link="${e[1]}">${e[0]}</hyper-link><br>`);
            
            splash(`<h3>${dev.name}<t-dark>${dev.tag}</t-dark></h3><text>${dev.desc}</text><br><br>${l}`);
        });
    }
}

customElements.define('c-h', Char);
customElements.define('c-d', Dot);
customElements.define('dev-t', DevT);