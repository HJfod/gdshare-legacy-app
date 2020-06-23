class CheckBox extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.addEventListener("click", e => this.check());
        this.innerHTML = `<tick-mark></tick-mark><text>\u2003\u2003${this.innerHTML}</text>`;
    }

    check() {
        if (this.hasAttribute("checked")) {
            this.removeAttribute("checked");
//          this.children[0].style.opacity = 0;
        } else {
            this.setAttribute("checked","");
 //         this.children[0].style.opacity = 1;
        }
    }
}

class mSearch extends HTMLInputElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const b = document.createElement("button");
        b.innerHTML = "\u{10005}";
        this.appendChild(b);

        console.log(b);
    }
}

customElements.define('check-box', CheckBox);
customElements.define('m-search', mSearch, { extends: "input" });