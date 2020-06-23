class AppTab extends HTMLElement {
    constructor () {
        super();
    }

    connectedCallback() {
        this.addEventListener("click", e => {
            this.switchTo();
        });
        if (this.hasAttribute("default")) this.switchTo()
    }

    switchTo() {
        arr(document.querySelectorAll("app-page")).forEach(i => {
            if (i.getAttribute("link") === this.getAttribute("link")) {
                i.style.display = "initial";
            } else {
                i.style.display = "none";
            }
        });

        if (document.querySelector(".selected-tab")) {
            document.querySelector(".selected-tab").classList.remove("selected-tab");
        }
        this.classList.add("selected-tab");
    }
}

customElements.define('app-tab', AppTab);