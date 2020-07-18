class CheckBox extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.addEventListener("click", e => this.check());
        this.innerHTML = `<text>\u2003\u2003${this.innerHTML}</text>`;
        this.parentNode.insertBefore(document.createElement("tick-mark"), this);
        if (!this.hasAttribute("checked")) {
            this.previousSibling.style.opacity = 0;
        }
        if (this.hasAttribute("var")) {
            arr(document.querySelectorAll(`[toggle-var="${this.getAttribute("var")}"]`)).forEach(x => { x.style.display = this.hasAttribute("checked") ? "" : "none"});
        }
    }

    check(set = null) {
        if (set === null) {
            if (this.hasAttribute("checked")) {
                this.removeAttribute("checked");
                this.previousSibling.style.opacity = 0;
            } else {
                this.setAttribute("checked","");
                this.previousSibling.style.opacity = 1;
            }
        } else {
            if (set === true) {
                this.setAttribute("checked","");
                this.previousSibling.style.opacity = 1;
            } else {
                this.removeAttribute("checked");
                this.previousSibling.style.opacity = 0;
            }
        }

        if (this.hasAttribute("var")) {
            global[this.getAttribute("var")] = this.hasAttribute("checked");
            arr(document.querySelectorAll(`[toggle-var="${this.getAttribute("var")}"]`)).forEach(x => { x.style.display = this.hasAttribute("checked") ? "" : "none"});
        }
        if (this.hasAttribute("ontoggle")) {
            const o = this.getAttribute("ontoggle");
            window[o.split("(").shift()](o.substring(o.indexOf("(") + 1,o.lastIndexOf(")")).replace(/__THISVAR/g, global[this.getAttribute("var")]));
        }

        if (this.hasAttribute("saveID")) {
            ipcSend({ action: "save-to-data", key: `checkbox`, val: { key: this.getAttribute("saveID"), val: this.hasAttribute("checked") } });
        }
    }
}

class SearchBox extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const i = document.createElement("input");
        i.classList.add("search-input")
        i.setAttribute("placeholder", "Type to search...");
        this.appendChild(i);

        const b = document.createElement("button");
        b.classList.add("search-button");
        b.innerHTML = "\u2715";
        b.setAttribute("onclick", `this.previousSibling.value = ""; this.style.display = "none"; this.parentNode.search()`);
        this.appendChild(b);

        this.children[0].addEventListener("input", e => this.search());
    }

    search() {
        document.querySelector(`select-menu[menu="${this.getAttribute("menu")}"]`).search(this.children[0].value);
        if (this.children[0].value) {
            this.children[1].style.display = "initial";
        }else {
            this.children[1].style.display = "none";
        }
    }
}

customElements.define('check-box', CheckBox);
customElements.define('search-box', SearchBox);