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
                i.style.opacity = "1";
                i.style.pointerEvents = "initial";
            } else {
                i.style.opacity = "0";
                i.style.pointerEvents = "none";
            }
        });

        arr(document.querySelectorAll("[removeOnDeselect]")).forEach(i => { if (i !== this) i.style.display = "none" });

        if (document.querySelector(".selected-tab")) {
            document.querySelector(".selected-tab").classList.remove("selected-tab");
        }

        this.classList.add("selected-tab");
    }
}

class AppPage extends HTMLElement {
    constructor () {
        super();
    }

    connectedCallback() {
        this.addEventListener("mousemove", () => {
            if (this.scrollHeight > this.offsetHeight) {
                this.style.setProperty("--resize", 3);
            } else {
                this.style.setProperty("--resize", 0);
            }
        });
        /*
        this.addEventListener("mouseout", () => {
            this.style.setProperty("--resize", 0);
        });
        */
    }
}

customElements.define('app-tab', AppTab);
customElements.define('app-page', AppPage);