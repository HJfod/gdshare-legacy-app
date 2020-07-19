class SelectMenu extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.style.height = this.getAttribute("size") * getCSS("--size-option") + "px";

        if (this.hasAttribute("options")) {
            JSON.parse(this.getAttribute("options")).forEach(i => {
                this.addOption(i);
            });
        }

        const t = document.createElement("select-info");
        if (this.hasAttribute("options")) t.style.display = "none";
        t.innerHTML = this.hasAttribute("empty-text") ? this.getAttribute("empty-text") : "No results found.";
        this.appendChild(t);
    }

    addOption(value) {
        const o = document.createElement("button");
        o.innerHTML = `<o-text>${value}</o-text>`;
        o.classList.add("option");
        o.setAttribute("onclick", `this.parentNode.setValue(this)`);

        if (this.hasAttribute("hover")) {
            JSON.parse(this.getAttribute("hover")).forEach(h => {
                if (h.type === "button") {
                    const b = document.createElement("button");
                    b.innerHTML = h.text;
                    b.setAttribute("onclick", h.onclick);
                    b.addEventListener("click", e => e.stopPropagation());
                    b.classList.add("option-hover");
                    o.appendChild(b);
                }
            });
        }

        this.appendChild(o);

        return o;
    }
    
    clear() {
        arr(this.querySelectorAll("button")).forEach(x => x.remove());
    }

    getValue() {
        let a = [];
        arr(this.querySelectorAll(".o-selected")).forEach(o => a.push(o.querySelector("o-text").innerHTML));
        return a;
    }

    setValue(to, force = false) {
        if (!this.hasAttribute("multiple")) arr(this.querySelectorAll(".o-selected")).forEach(o => o.classList.remove("o-selected"));

        to.classList.contains('o-selected') ? to.classList.remove('o-selected') : to.classList.add('o-selected');
    }

    search(query) {
        let found = false;
        arr(this.children).forEach(o => {
            if (o.tagName !== "SELECT-INFO") {
                if (o.innerHTML.toLowerCase().trim().includes(query.toLowerCase().trim())) {
                    found = true;
                    o.style.display = "initial";
                } else {
                    o.style.display = "none";
                }
            }
        });
        if (!found) {
            this.querySelector("select-info").style.display = "initial";
        } else {
            this.querySelector("select-info").style.display = "none";
        }
    }
}

customElements.define('select-menu', SelectMenu);