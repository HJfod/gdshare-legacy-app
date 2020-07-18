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
        if (this.hasAttribute("multiple")) i.setAttribute("multiple","")

        i.addEventListener("change", e => {
            if (this.hasAttribute("change")) {
                switch (this.getAttribute("change")) {
                    case "import":
                        const i = document.querySelector("imported-levels");
                        Array.from(e.target.files).forEach(f => {
                            const l = document.createElement("gmd-level");
                            const r = document.createElement("roll-over");
                            const t = document.createElement("roll-text");
                            const c = document.createElement("roll-content");

                            l.setAttribute("id", `import::${f.name}`);
                            l.setAttribute("levelName", f.name);
                            l.setAttribute("levelPath", f.path.replace(/\\/g,"/"));

                            ipcSend({ action: "level-get-info", name: f.path, returnCode: `import::${f.name}` });

                            t.innerHTML = "Loading level...";
                            c.innerHTML = "Loading level...";

                            r.appendChild(t);
                            r.appendChild(c);

                            l.appendChild(r);

                            this.parentNode.appendChild(l);
                        });
                        e.target.value = "";
                        break;
                }
            }else {
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
            }
        });
        this.appendChild(i);
    }
}

class GMDLevel extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        /** TODO:
         * Add button to close level
         */
    }
}

class ImportedLevels extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const observer = new MutationObserver((mList, obs) => {
            mList.forEach(m => {
                if (m.type === "childList") {
                    if (this.children.length > 1) {
                        this.setAttribute("has-content", "");
                    } else {
                        this.removeAttribute("has-content");
                    }
                }
            });
        });

        observer.observe(this, { attributes: false, childList: true, subtree: true });
    }
}

customElements.define("drop-area", fileInput);
customElements.define("gmd-level", GMDLevel);
customElements.define("imported-levels", ImportedLevels);