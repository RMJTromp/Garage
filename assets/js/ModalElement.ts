class ModalElement extends HTMLElement {

    private closeable = true;
    private readonly removeFromDomOnClose;

    constructor(removeFromDomOnClose : boolean = false) {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    left: 0;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #0000009e;
                    z-index: 1001;
                    display: none;
                }
            </style>
            <slot></slot>
        `;

        this.removeFromDomOnClose = removeFromDomOnClose;
        let startElement : EventTarget = null;
        this.addEventListener("mousedown", (e) => {
            startElement = e.target;
        });

        this.addEventListener("mouseup", (e) => {
            if(e.target === startElement && e.target === this && this.isCloseable()) this.close();
            startElement = null;
        });

        const closeButton = $("<i>", {class: "codicon codicon-chrome-close"});
        this.append(closeButton);
        closeButton.addEventListener("click", () => {
            if(this.isCloseable()) this.close();
        });

        window.addEventListener("keyup", (e) => {
            if(this.isCloseable() && e.key === "Escape" && !e.ctrlKey && !e.shiftKey && !e.altKey) this.close();
        });
    }

    isOpen() : boolean {
        return document.body.contains(this) && this.style.display !== "none";
    }

    open() {
        this.style.display = "block";
        if(!document.body.contains(this)) document.body.append(this);
        document.body.style.overflow = "hidden";
        this.dispatchEvent(new Event("open"));
    }

    close() {
        if(this.removeFromDomOnClose) this.remove();
        this.style.display = "";
        document.body.style.overflow = "";
        this.dispatchEvent(new Event("close"));
    }

    isCloseable() : boolean {
        return this.closeable;
    }

    setCloseable(toggle : boolean) {
        this.closeable = typeof toggle === "boolean" ? toggle : this.closeable;
    }

}

window.customElements.define('x-modal', ModalElement);