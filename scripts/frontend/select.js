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
    }

    addOption(value) {
        const o = document.createElement("button");
        o.innerHTML = value;
        o.classList.add("option");
        o.setAttribute("onclick", `this.parentNode.setValue(this)`);
        this.appendChild(o);
    }

    getValue() {
        let a = [];
        arr(this.querySelectorAll(".o-selected")).forEach(o => a.push(o.innerHTML));
        return a;
    }

    setValue(to, force = false) {
        if (!this.hasAttribute("multiple")) arr(this.querySelectorAll(".o-selected")).forEach(o => o.classList.remove("o-selected"));

        to.classList.contains('o-selected') ? to.classList.remove('o-selected') : to.classList.add('o-selected');
    }
}

customElements.define('select-menu', SelectMenu);