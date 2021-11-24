interface InputsObject {
    name, address, postcode, location
}

class ClientEditorModalElement extends ModalElement {

    public readonly inputs : InputsObject = {
        name: null,
        address: null,
        postcode: null,
        location: null
    };
    public readonly button;
    private readonly formgroup = $("<div>", {class:"formgroup"});
    private readonly suggestion = {
        list: $("<ul>"),
        focus: -1
    };

    public constructor(removeFromDomOnClose : boolean = false) {
        super(removeFromDomOnClose);

        const container = $("<div>", {class: "container"});
        {
            // main
            const main = $("<main>");
            this.inputs.name = $("<input>", {type:"text", placeholder: "Naam"});
            this.inputs.address = $("<input>", {type:"text", placeholder: "Adres"});
            this.inputs.postcode = $("<input>", {type:"text", placeholder: "Postcode", maxlength: 6});
            this.inputs.location = $("<input>", {type:"text", placeholder: "Plaats"});

            // defined earlier for access
            this.button = $("<button>", {class: "primary", text: "Voeg toe"});

            // add event listeners
            this.addNameInputListeners();
            this.addAddressInputListeners();
            this.addPostcodeInputListeners();
            this.addLocationInputListeners();
            this.addEventListeners();

            this.addEventListener("close", () => {
                Object.keys(this.inputs).forEach(key => {
                    this.inputs[key].value = "";
                    this.inputs[key].classList.remove("error");
                });
                this.button.disabled = true;
            });

            this.formgroup.append(this.inputs.location);
            main.append(this.inputs.name, this.inputs.address, this.inputs.postcode, this.formgroup);
            container.append(main);

            {
                // footer
                const footer = $("<footer>");
                const cancelButton = $("<button>");
                cancelButton.innerText = "Annuleren";
                cancelButton.addEventListener("click", () => this.close());

                footer.append(cancelButton, this.button);
                container.append(footer);
            }
        }
        this.append(container);
    }

    private addNameInputListeners() {
        this.inputs.name.addEventListener("keydown", (e) => {
            if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
            if(!/^[\p{L}\- ]*$/u.test(e.key)) {
                e.preventDefault();
                return false;
            }
        });

        this.inputs.name.addEventListener("paste", (e) => {
            const pasteContent = e.clipboardData.getData("Text");
            let parts = [this.inputs.name.value.slice(0,this.inputs.name.selectionStart), this.inputs.name.value.slice(this.inputs.name.selectionEnd)];
            let newValue = `${parts[0]}${pasteContent}${parts[1]}`;
            if(!/^[\p{L}\- ]*$/u.test(newValue)) {
                e.preventDefault();
                return false;
            }
        });
    }

    private addAddressInputListeners() {
        this.inputs.address.addEventListener("keydown", (e) => {
            if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
            if(!/^[\p{L}\p{N}\- ]*$/u.test(e.key)) {
                e.preventDefault();
                return false;
            }
        });

        this.inputs.address.addEventListener("paste", (e) => {
            const pasteContent = e.clipboardData.getData("Text");
            let parts = [this.inputs.address.value.slice(0,this.inputs.address.selectionStart), this.inputs.address.value.slice(this.inputs.address.selectionEnd)];
            let newValue = `${parts[0]}${pasteContent}${parts[1]}`;
            if(!/^[\p{L}\p{N}\- ]*$/u.test(newValue)) {
                e.preventDefault();
                return false;
            }
        });
    }

    private addPostcodeInputListeners() {
        this.inputs.postcode.addEventListener("keydown", (e) => {
            if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
            if(!/^[\da-z]*$/i.test(e.key)) {
                e.preventDefault();
                return false;
            }

            const len = this.inputs.postcode.selectionStart ?? this.inputs.postcode.value.length;
            if(len == 0) {
                if(!/^[1-9]$/.test(e.key)) {
                    e.preventDefault();
                    return false;
                }
            } else if(len > 0 && len < 4) {
                if(!/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                    return false;
                }
            } else if(len === 4 || len === 5) {
                if(len == 4) {
                    if(!/^[a-z]$/i.test(e.key)) {
                        e.preventDefault();
                        return false;
                    }
                } else if(len == 5) {
                    if(!/^[a-z]$/i.test(e.key)) {
                        e.preventDefault();
                        return false;
                    } else {
                        if(this.inputs.postcode.value[4].toLowerCase() === "s" && /^[ads]$/i.test(e.key)) {
                            e.preventDefault();
                            return false;
                        }
                    }
                }
            }
        });

        this.inputs.postcode.addEventListener("blur", () => {
            this.inputs.postcode.value = this.inputs.postcode.value.toUpperCase();
        });

        this.inputs.postcode.addEventListener("change", () => {
            this.inputs.postcode.value = this.inputs.postcode.value.toUpperCase();
        });

        this.inputs.postcode.addEventListener("paste", (e) => {
            const pasteContent = e.clipboardData.getData("Text");
            if(/^[0-9a-z]+$/i.test(pasteContent)) {
                if(/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i.test(pasteContent)) {
                    this.inputs.postcode.value = pasteContent.toUpperCase();
                } else {
                    let parts = [this.inputs.postcode.value.slice(0,this.inputs.postcode.selectionStart), this.inputs.postcode.value.slice(this.inputs.postcode.selectionEnd)];
                    let newPostCode = `${parts[0]}${pasteContent}${parts[1]}`;
                    if(/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i.test(newPostCode)) {
                        this.inputs.postcode.value = newPostCode;
                    }
                }
            }
            e.preventDefault();
            return false;
        });
    }

    private addLocationInputListeners() {
        this.inputs.location.addEventListener("keydown", (e) => {
            if(e.key === "ArrowUp") {
                if(this.formgroup.contains(this.suggestion.list)) {
                    if(this.suggestion.focus === -1) this.suggestion.focus = 0;
                    if(this.suggestion.focus > 0) this.suggestion.focus--;
                    this.suggestion.list.querySelectorAll(".active").forEach(child => child.classList.remove("active"));
                    this.suggestion.list.children[this.suggestion.focus].classList.add("active");
                }
                e.preventDefault();
                return false;
            } else if(e.key === "ArrowDown") {
                if(this.formgroup.contains(this.suggestion.list)) {
                    if(this.suggestion.focus < this.suggestion.list.childElementCount - 1) this.suggestion.focus++;
                    this.suggestion.list.querySelectorAll(".active").forEach(child => child.classList.remove("active"));
                    this.suggestion.list.children[this.suggestion.focus].classList.add("active");
                }
                e.preventDefault();
                return false;
            } else if(e.key === "Enter") {
                if(this.suggestion.focus != -1) {
                    this.inputs.location.value = this.suggestion.list.children[this.suggestion.focus].innerText;
                    this.suggestion.list.remove();
                    this.inputs.location.focus();
                }
                e.preventDefault();
                return false;
            }

            if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
            if(!/^[\p{L} \-'.]$/u.test(e.key)) {
                e.preventDefault();
                return false;
            }
        });

        this.inputs.location.addEventListener("keyup", (e) => {
            if(e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter") return;
            this.showSuggestions();
        });
        this.inputs.location.addEventListener("focus", () => this.showSuggestions());
        this.inputs.location.addEventListener("blur", () => {
            if(RMJTromp.garage.steden.list.indexOf(this.inputs.location.value) === -1) {
                const firstResult = RMJTromp.garage.steden.search(this.inputs.location.value)[0]?.item ?? null;
                if(firstResult && levenshtein(firstResult.toLowerCase(), this.inputs.location.value.toLowerCase()) >= .85) {
                    this.inputs.location.value = firstResult;
                }
            }

            setTimeout(() => {
                if(this.inputs.location !== document.activeElement) this.suggestion.list.remove();
            }, 100);
        });

        this.inputs.location.addEventListener("paste", (e) => {
            const pasteContent = e.clipboardData.getData("Text");
            let parts = [this.inputs.location.value.slice(0,this.inputs.location.selectionStart), this.inputs.location.value.slice(this.inputs.location.selectionEnd)];
            let newValue = `${parts[0]}${pasteContent}${parts[1]}`;
            if(!/^[\p{L} \-'.]*$/u.test(newValue)) {
                e.preventDefault();
                return false;
            }
        });

        this.inputs.location.addEventListener("change", () => {
            if(RMJTromp.garage.steden.list.indexOf(this.inputs.location.value) === -1) {
                const firstResult = RMJTromp.garage.steden.search(this.inputs.location.value)[0]?.item ?? null;
                if(levenshtein((firstResult?.toLowerCase() ?? ""), this.inputs.location.value.toLowerCase()) >= .85) {
                    this.inputs.location.value = firstResult;
                }
            }
        });
    }

    private addEventListeners() {
        const inputs = [
            [this.inputs.name, /^[\p{L}\- ]{2,}$/u],
            [this.inputs.address, /^[\p{L}\p{N}\- ]{2,}$/u],
            [this.inputs.postcode, /^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i],
            [this.inputs.location, /^[\p{L} \-'.]+$/u],
        ];

        inputs.forEach(item => {
            const checkForCompletion = () => {
                let complete = true;

                // @ts-ignore
                for(let input of inputs) {
                    if(!input[1].test(input[0].value)) complete = false;
                }

                if(RMJTromp.garage.steden.list.indexOf(this.inputs.location.value) === -1) complete = false;

                if(complete === this.button.disabled) this.button.disabled = !complete;
            }
            const onUpdate = () => {
                if(!item[1].test(item[0].value)) item[0].classList.add("error");
                else if(item[0].classList.contains("error")) item[0].classList.remove("error");
            }
            item[0].addEventListener("change", () => {onUpdate(); checkForCompletion();});
            item[0].addEventListener("blur", () => {onUpdate(); checkForCompletion();});
            item[0].addEventListener("keydown", () => {
                if(item[0].classList.contains("error")) item[0].classList.remove("error");
                checkForCompletion();
            });
            item[0].addEventListener("keyup", () => checkForCompletion());
        });
    }

    private showSuggestions() {
        const value = this.inputs.location.value.trim();
        this.suggestion.list.innerHTML = "";
        this.suggestion.focus = -1;
        if(value.length > 0) {
            const res = RMJTromp.garage.steden.search(value).map(item => {
                return [item.item, levenshtein(item.item.toLowerCase(), value.toLowerCase())]
            }).sort((a,b) => {
                return a[1] < b[1] ? 1 : a[1] < b[1] ? -1 : 0;
            }).map(item => item[0]).splice(0,5);

            if(res.length > 0) {
                if(!this.formgroup.contains(this.suggestion.list)) this.formgroup.append(this.suggestion.list);
                for(let i = 0; i < Math.min(5, res.length); i++) {
                    const item = $("<li>");
                    item.innerText = res[i];
                    item.addEventListener("click", () => {
                        this.suggestion.list.remove();
                        this.suggestion.list.innerHTML = "";
                        this.inputs.location.value = res[i];
                        this.inputs.location.dispatchEvent(new Event("blur"));
                    });
                    this.suggestion.list.append(item);
                }
            } else if(this.formgroup.contains(this.suggestion.list)) this.suggestion.list.remove();
        }
    }

}

window.customElements.define('client-editor-modal', ClientEditorModalElement);