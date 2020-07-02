class HelpButton extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = this.hasAttribute("text") ? this.getAttribute("text") : "<b><i>Help</i></b>";

        this.addEventListener("click", () => {
            document.querySelector('#help-tab').style.display = "initial";
            document.querySelector('#help-tab').switchTo();

            if (this.hasAttribute("help")) {
                arr(document.getElementById("help-page").querySelectorAll("roll-over")).forEach(r => {
                    if (r.getAttribute("help") === this.getAttribute("help")) {
                        r.roll(true);
                    }
                });
            }
        });
    }
}

customElements.define("help-button", HelpButton);