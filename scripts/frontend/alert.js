class AlertClose extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.addEventListener("click", () => {
            document.querySelector("alert-area").style.display = "none";
        });
    }
}

customElements.define('alert-close', AlertClose);