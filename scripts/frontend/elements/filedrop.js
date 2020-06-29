class fileInput extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.files = [];

        const t = document.createElement("drop-text");
        t.innerHTML = this.getAttribute("text");
        this.appendChild(t);

        const i = document.createElement("input");
        i.setAttribute("type", "file");
        i.setAttribute("class", "drop-input");
        if (this.hasAttribute("multiple")) i.setAttribute("multiple","");

        i.addEventListener("change", e => {
            this.files = [];
            Array.from(e.target.files)
                .forEach(f => f.name.endsWith(global.fileSuffix) ? 
                    this.files.push({ name: f.name, path: f.path.replace(/\\/g,"/") }) 
                    : console.log(`File ${f.name} not accepted.`)
                );

            if (this.files.length > 0){
                this.querySelector("drop-text").innerHTML = `${this.files.map(a => global.displayFileTypes ? a.name : a.name.split(".").shift()).join(", ")}`;
                this.setAttribute("has-files","");
            } else {
                this.querySelector("drop-text").innerHTML = this.getAttribute("text");
                this.removeAttribute("has-files");
            }
        });
        this.appendChild(i);
    }
}

customElements.define("drop-area", fileInput);