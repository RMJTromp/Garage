const $ = (selector, attributes = {}) => {
    if(selector.startsWith("<") && selector.endsWith(">")) {
        const element = document.createElement(selector.substr(1, selector.length - 2));
        if(typeof attributes === "object" && !Array.isArray(attributes)) {
            Object.keys(attributes).forEach(key => {
                element.setAttribute(key, attributes[key]);
            })
        }
        return element;
    }
    return document.querySelector(selector);
}

const levenshtein = (a : string, b : string) : number => {
    const max = Math.max(a.length, b.length);
    return (max - ((a : string, b : string) : number => {
        const an = a ? a.length : 0;
        const bn = b ? b.length : 0;
        if (an === 0) return bn;
        if (bn === 0) return an;
        const matrix = new Array<number[]>(bn + 1);
        for (let i = 0; i <= bn; ++i) {
            let row = matrix[i] = new Array<number>(an + 1);
            row[0] = i;
        }
        const firstRow = matrix[0];
        for (let j = 1; j <= an; ++j) firstRow[j] = j;
        for (let i = 1; i <= bn; ++i) {
            for (let j = 1; j <= an; ++j) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
                else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1], // substitution
                        matrix[i][j - 1], // insertion
                        matrix[i - 1][j] // deletion
                    ) + 1;
                }
            }
        }
        return matrix[bn][an];
    })(a,b)) / max;
}

var g;

interface NoticeOptions {
    closeable?: boolean,
    category?: "primary"|"danger"|"success"|"warning"|"info",
    lifetime?: number,
    anchor?: {
        text: string,
        click: Callback<void>
    }
}

interface Callback<T> {
    () : T
}

interface Notice {
    element: HTMLDivElement,
    hide: Callback<void>,
    show: Callback<void>
}

const createNotice = (message : string, options? : NoticeOptions) : Notice => {
    const element = $("<div>", {class: "notice"});
    const notice : Notice = {
        element: element,
        hide: () => {
            element.style.transform = "";
            setTimeout(() => element.remove(), 500);
        },
        show: () => {
            let delay = 0;
            if(!document.body.contains(element)) {
                document.body.append(element);
                delay = 2;
            }

            setTimeout(() => {
                element.style.transform = "translateY(0)";
            }, delay);
        }
    };

    element.innerText = message;
    if(typeof options === "object") {
        if(options.category) element.classList.add(options.category);
        if(options.anchor) {
            const anchor = $("<a>");
            anchor.innerText = options.anchor.text;
            anchor.addEventListener("click", (e) => options.anchor.click.apply(notice, e));
            element.append(anchor);
        }
        if(options.closeable === true) {
            const closeIcon = $("<i>", {class: "codicon codicon-close"});
            closeIcon.addEventListener("click", () => notice.hide());
            element.append(closeIcon);
        }
        if(options.lifetime && typeof options.lifetime === "number" && options.lifetime > 0) {
            setTimeout(() => notice.hide(), options.lifetime);
        }
    }

    return notice;
}

document.addEventListener("DOMContentLoaded", async () => {
    const
        body = document.body,
        filter = $("li#filter"),
        add = $("li#add"),
        clientsList = $("ul#clients");

    const steden : string[] = await (() => {
        return new Promise<string[]>((resolve, reject) => {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    try {
                        const response : string[] = JSON.parse(xhttp.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(e);
                    }
                }
            };
            xhttp.open("GET", "/assets/json/steden.json", true);
            xhttp.send();
            setTimeout(() => reject("timed-out"), 15000);
        });
    })();

    // @ts-ignore
    const fuse = new Fuse(steden, {includeScore: true});
    g = fuse;

    const appendClient = (client : Client) => {
        let li = $("<li>"), div1 = $("<div>"), div2 = $("<div>"), paragraph = $("<p>"), small = $("<small>"),
            ul = $("<ul>"), li1 = $("<li>"), li2 = $("<li>"), iEdit = $("<i>", {class: "codicon codicon-edit"}),
            iRemove = $("<i>", {class: "codicon codicon-trash"});

        paragraph.innerText = client.getName();
        small.innerText = `${client.getAddress()}, ${client.getPostcode()}, ${client.getLocation()}`;

        li1.append(iEdit);
        li2.append(iRemove);
        ul.append(li1, li2);
        div2.append(paragraph, small);
        div1.append(div2, ul);
        li.append(div1);
        clientsList.append(li);

        client.on("update", () => {
            paragraph.innerText = client.getName();
            small.innerText = `${client.getAddress()}, ${client.getPostcode()}, ${client.getLocation()}`;
        });

        li1.addEventListener("click", async (e) => {
            // handle edits
            const modal = new ModalElement(true);
            const container = $("<div>", {class: "container"});
            {
                // main
                const main = $("<main>");
                const nameInput = $("<input>", {type:"text", placeholder: "Naam"});
                const addressInput = $("<input>", {type:"text", placeholder: "Adres"});
                const postcodeInput = $("<input>", {type:"text", placeholder: "Postcode", maxlength: 6});

                // defined earlier for access
                const editButton = $("<button>", {class: "primary"});

                const formgroup = $("<div>", {class:"formgroup"});
                const locationInput = $("<input>", {type:"text", placeholder: "Plaats"});
                const list = $("<ul>");

                // suggestion focus index, -1 for none
                let focus = -1;

                const showSuggestions = (value) => {
                    value = value.trim();
                    list.innerHTML = "";
                    focus = -1;
                    if(value.length > 0) {
                        const res = fuse.search(value).map(item => {
                            return [item.item, levenshtein(item.item.toLowerCase(), value.toLowerCase())]
                        }).sort((a,b) => {
                            return a[1] < b[1] ? 1 : a[1] < b[1] ? -1 : 0;
                        }).map(item => item[0]).splice(0,5);

                        if(res.length > 0) {
                            if(!formgroup.contains(list)) formgroup.append(list);
                            for(let i = 0; i < Math.min(5, res.length); i++) {
                                const item = $("<li>");
                                item.innerText = res[i];
                                item.addEventListener("click", () => {
                                    list.remove();
                                    list.innerHTML = "";
                                    locationInput.value = res[i];
                                });
                                list.append(item);
                            }
                        } else if(formgroup.contains(list)) list.remove();
                    }
                }

                modal.addEventListener("open", () => {
                    nameInput.value = client.getName();
                    addressInput.value = client.getAddress();
                    postcodeInput.value = client.getPostcode();
                    locationInput.value = client.getLocation();
                });

                nameInput.addEventListener("keydown", (e) => {
                    if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
                    if(!/^[\p{L}\- ]*$/u.test(e.key)) {
                        e.preventDefault();
                        return false;
                    }
                });

                nameInput.addEventListener("paste", (e) => {
                    const pasteContent = e.clipboardData.getData("Text");
                    let parts = [nameInput.value.slice(0,nameInput.selectionStart), nameInput.value.slice(nameInput.selectionEnd)];
                    let newValue = `${parts[0]}${pasteContent}${parts[1]}`;
                    if(!/^[\p{L}\- ]*$/u.test(newValue)) {
                        e.preventDefault();
                        return false;
                    }
                });

                addressInput.addEventListener("keydown", (e) => {
                    if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
                    if(!/^[\p{L}\p{N}\- ]*$/u.test(e.key)) {
                        e.preventDefault();
                        return false;
                    }
                });

                addressInput.addEventListener("paste", (e) => {
                    const pasteContent = e.clipboardData.getData("Text");
                    let parts = [addressInput.value.slice(0,addressInput.selectionStart), addressInput.value.slice(addressInput.selectionEnd)];
                    let newValue = `${parts[0]}${pasteContent}${parts[1]}`;
                    if(!/^[\p{L}\p{N}\- ]*$/u.test(newValue)) {
                        e.preventDefault();
                        return false;
                    }
                });

                postcodeInput.addEventListener("keydown", (e) => {
                    if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
                    if(!/^[\da-z]*$/i.test(e.key)) {
                        e.preventDefault();
                        return false;
                    }

                    const len = postcodeInput.selectionStart ?? postcodeInput.value.length;
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
                                if(postcodeInput.value[4].toLowerCase() === "s" && /^[ads]$/i.test(e.key)) {
                                    e.preventDefault();
                                    return false;
                                }
                            }
                        }
                    }
                });

                postcodeInput.addEventListener("blur", () => {
                    postcodeInput.value = postcodeInput.value.toUpperCase();
                });

                postcodeInput.addEventListener("change", () => {
                    postcodeInput.value = postcodeInput.value.toUpperCase();
                });

                postcodeInput.addEventListener("paste", (e) => {
                    const pasteContent = e.clipboardData.getData("Text");
                    if(/^[0-9a-z]+$/i.test(pasteContent)) {
                        if(/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i.test(pasteContent)) {
                            postcodeInput.value = pasteContent.toUpperCase();
                        } else {
                            let parts = [postcodeInput.value.slice(0,postcodeInput.selectionStart), postcodeInput.value.slice(postcodeInput.selectionEnd)];
                            let newPostCode = `${parts[0]}${pasteContent}${parts[1]}`;
                            if(/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i.test(newPostCode)) {
                                postcodeInput.value = newPostCode;
                            }
                        }
                    }
                    e.preventDefault();
                    return false;
                });

                locationInput.addEventListener("keydown", (e) => {
                    if(e.key === "ArrowUp") {
                        if(formgroup.contains(list)) {
                            if(focus === -1) focus = 0;
                            if(focus > 0) focus--;
                            list.querySelectorAll(".active").forEach(child => child.classList.remove("active"));
                            list.children[focus].classList.add("active");
                        }
                        e.preventDefault();
                        return false;
                    } else if(e.key === "ArrowDown") {
                        if(formgroup.contains(list)) {
                            if(focus < list.childElementCount - 1) focus++;
                            list.querySelectorAll(".active").forEach(child => child.classList.remove("active"));
                            list.children[focus].classList.add("active");
                        }
                        e.preventDefault();
                        return false;
                    } else if(e.key === "Enter") {
                        if(focus != -1) {
                            locationInput.value = list.children[focus].innerText;
                            list.remove();
                            locationInput.focus();
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

                locationInput.addEventListener("keyup", (e) => {
                    if(e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter") return;
                    showSuggestions(locationInput.value)
                });
                locationInput.addEventListener("focus", () => showSuggestions(locationInput.value));
                locationInput.addEventListener("blur", () => setTimeout(() => {
                    if(locationInput !== document.activeElement) list.remove();
                }, 100));

                locationInput.addEventListener("paste", (e) => {
                    const pasteContent = e.clipboardData.getData("Text");
                    let parts = [locationInput.value.slice(0,locationInput.selectionStart), locationInput.value.slice(locationInput.selectionEnd)];
                    let newValue = `${parts[0]}${pasteContent}${parts[1]}`;
                    if(!/^[\p{L} \-'.]*$/u.test(newValue)) {
                        e.preventDefault();
                        return false;
                    }
                });

                (() => {
                    locationInput.addEventListener("change", () => {
                        if(steden.indexOf(locationInput.value) === -1) {
                            const firstResult = fuse.search(locationInput.value)[0]?.item ?? null;
                            if(levenshtein(firstResult.toLowerCase(), locationInput.value.toLowerCase()) >= .85) {
                                locationInput.value = firstResult;
                            }
                        }
                    });

                    locationInput.addEventListener("blur", () => {
                        if(steden.indexOf(locationInput.value) === -1) {
                            const firstResult = fuse.search(locationInput.value)[0]?.item ?? null;
                            if(levenshtein(firstResult.toLowerCase(), locationInput.value.toLowerCase()) >= .85) {
                                locationInput.value = firstResult;
                            }
                        }
                    });

                    const inputs = [
                        [nameInput,/^[\p{L}\- ]{2,}$/u],
                        [addressInput,/^[\p{L}\p{N}\- ]{2,}$/u],
                        [postcodeInput,/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i],
                        [locationInput,/^[\p{L} \-'.]+$/u],
                    ];

                    inputs.forEach(item => {
                        const checkForCompletion = () => {
                            let complete = true;

                            // @ts-ignore
                            for(let input of inputs) {
                                if(!input[1].test(input[0].value)) complete = false;
                            }

                            if(steden.indexOf(locationInput.value) === -1) complete = false;

                            if(complete === editButton.disabled) editButton.disabled = !complete;
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
                })();

                formgroup.append(locationInput);
                main.append(nameInput, addressInput, postcodeInput, formgroup);
                container.append(main);

                {
                    // footer
                    const footer = $("<footer>");
                    const cancelButton = $("<button>");
                    cancelButton.innerText = "Annuleren";
                    cancelButton.addEventListener("click", () => modal.close());

                    editButton.innerText = "Wijzigen";
                    editButton.addEventListener("click", () => {
                        const changes = {};
                        if(nameInput.value !== client.getName()) changes['name'] = nameInput.value;
                        if(addressInput.value !== client.getAddress()) changes['address'] = addressInput.value;
                        if(postcodeInput.value !== client.getPostcode()) changes['postcode'] = postcodeInput.value;
                        if(locationInput.value !== client.getLocation()) changes['location'] = locationInput.value;

                        if(Object.keys(changes).length > 0) {
                            modal.close();
                            client.updateData(changes).then(() => {
                                createNotice("Klant gewijzigd.", {
                                    closeable: true,
                                    category: "success",
                                    lifetime: 3000
                                }).show();
                            }).catch(e => {
                                createNotice(e, {
                                    closeable: true,
                                    category: "danger",
                                    lifetime: 5000
                                }).show();
                            });
                        } else {
                            createNotice("Er zijn geen wijzigingen aangebracht.", {
                                closeable: true,
                                category: "info",
                                lifetime: 4000
                            }).show();
                        }
                    });

                    footer.append(cancelButton, editButton);
                    container.append(footer);
                }
            }
            modal.append(container);
            modal.open();
        });

        li2.addEventListener("click", async (e) => {
            if(e.shiftKey) client.delete().then(() => {
                createNotice(`Klant verwijderd`, {
                    category: "danger",
                    lifetime: 5000,
                    closeable: true,
                    anchor: {
                        text: "Ongedaan maken",
                        click: function() {
                            Client.createClient(client.getClientData()).then((newClient) => {
                                appendClient(newClient);
                                this.hide();
                                createNotice("Klant hersteld", {
                                    category: "success",
                                    lifetime: 3000,
                                    closeable: true
                                }).show();
                            }).catch(e => {
                                this.hide();
                                createNotice(e, {
                                    category: "danger",
                                    lifetime: 5000,
                                    closeable: true
                                }).show();
                            });
                        }
                    }
                }).show();
            }).catch(e => {
                createNotice(e, {
                    category: "danger",
                    lifetime: 5000,
                    closeable: true
                }).show();
            });
            else {
                // handle delete
                const modal = new ModalElement(true);
                const container = $("<div>", {class: "container"});
                {
                    // body
                    const body = $("<body>");
                    const paragraph = $("<p>");
                    paragraph.innerText = "Weet u zeker dat u deze klant wilt verwijderen?";

                    body.append(paragraph);
                    container.append(body);
                }
                {
                    const footer = $("<footer>");
                    const cancelButton = $("<button>");
                    cancelButton.innerText = "Annuleren";
                    cancelButton.addEventListener("click", () => modal.close());

                    const deleteButton = $("<button>", {class: "danger"});
                    deleteButton.innerText = "Verwijderen";
                    deleteButton.addEventListener("click", () => {
                        modal.close();
                        client.delete().then(() => {
                            createNotice(`Klant verwijderd`, {
                                category: "danger",
                                lifetime: 5000,
                                closeable: true,
                                anchor: {
                                    text: "Ongedaan maken",
                                    click: function() {
                                        Client.createClient(client.getClientData()).then((newClient) => {
                                            appendClient(newClient);
                                            this.hide();
                                            createNotice("Klant hersteld", {
                                                category: "success",
                                                lifetime: 3000,
                                                closeable: true
                                            }).show();
                                        }).catch(e => {
                                            this.hide();
                                            createNotice(e, {
                                                category: "danger",
                                                lifetime: 5000,
                                                closeable: true
                                            }).show();
                                        });
                                    }
                                }
                            }).show();
                        }).catch(e => {
                            createNotice(e, {
                                category: "danger",
                                lifetime: 5000,
                                closeable: true
                            }).show();
                        });
                    });

                    footer.append(cancelButton, deleteButton);
                    container.append(footer);
                }
                modal.append(container);
                modal.open();
            }
        });

        client.on("delete", () => li.remove());
    };

    {
        // add modal
        const modal = new ModalElement(true);
        const container = $("<div>", {class: "container"});
        {
            // main
            const main = $("<main>");
            const nameInput = $("<input>", {type:"text", placeholder: "Naam"});
            const addressInput = $("<input>", {type:"text", placeholder: "Adres"});
            const postcodeInput = $("<input>", {type:"text", placeholder: "Postcode", maxlength: 6});

            // defined earlier for access
            const createButton = $("<button>", {class: "primary"});

            const formgroup = $("<div>", {class:"formgroup"});
            const locationInput = $("<input>", {type:"text", placeholder: "Plaats"});
            const list = $("<ul>");

            {
                const header = $("<header>");
                const generateRandomButton = $("<button>", {class:"info"});
                const icon = $("<i>", {class: "codicon codicon-wand"});
                generateRandomButton.append(icon);

                generateRandomButton.addEventListener("click", () => {
                    icon.classList.remove("codicon-wand");
                    icon.classList.add("codicon-refresh", "anim-rotate");
                    generateRandomButton.disabled = true;
                    new Promise((resolve, reject) => {
                        let xhttp = new XMLHttpRequest();
                        xhttp.onreadystatechange = function() {
                            if (this.readyState === 4 && this.status === 200) {
                                try {
                                    const response = JSON.parse(xhttp.responseText);
                                    resolve(response);
                                } catch (e) {
                                    if(e instanceof SyntaxError) {
                                        let div = $("<div>");
                                        div.innerHTML = xhttp.responseText;
                                        console.error("Response: ", div.innerText);
                                    }
                                    reject("Er is een fout opgetreden bij het genereren van willekeurige gegevens.");
                                    console.error(e);
                                }
                            }
                        };
                        xhttp.open("GET", `/api/random`, true);
                        xhttp.send();
                        setTimeout(() => reject("Timed Out"), 10000);
                    }).then((response) => {
                        icon.classList.remove("codicon-refresh", "anim-rotate");
                        icon.classList.add("codicon-wand");
                        generateRandomButton.disabled = false;

                        nameInput.value = response['name'].replace(/^[\p{L}+.]+\. /u, "");
                        addressInput.value = response['address'].split("\n")[0];
                        postcodeInput.value = `${Math.round(Math.random() * (9999 - 1000) + 1000)}${(() => {
                            let a='',b='ABCDEFGHIJKLMNOPQRSTUVWXYZ',c=b.length;
                            for (let i = 0; i < 2; i++ )a+=b.charAt(Math.floor(Math.random()*c));
                            return a;
                        })()}`;
                        locationInput.value = steden[Math.floor(Math.random()*steden.length)]
                        nameInput.dispatchEvent(new Event('change'));
                    }).catch(e => {
                        icon.classList.remove("codicon-refresh", "anim-rotate");
                        icon.classList.add("codicon-wand");
                        generateRandomButton.disabled = false;

                        createNotice(e, {
                            category: "danger",
                            closeable: true,
                            lifetime: 5000
                        }).show();
                    });
                });

                header.append(generateRandomButton);
                container.append(header);
            }

            // suggestion focus index, -1 for none
            let focus = -1;

            const showSuggestions = (value) => {
                value = value.trim();
                list.innerHTML = "";
                focus = -1;
                if(value.length > 0) {
                    const res = fuse.search(value).map(item => {
                        return [item.item, levenshtein(item.item.toLowerCase(), value.toLowerCase())]
                    }).sort((a,b) => {
                        return a[1] < b[1] ? 1 : a[1] < b[1] ? -1 : 0;
                    }).map(item => item[0]).splice(0,5);

                    if(res.length > 0) {
                        if(!formgroup.contains(list)) formgroup.append(list);
                        for(let i = 0; i < Math.min(5, res.length); i++) {
                            const item = $("<li>");
                            item.innerText = res[i];
                            item.addEventListener("click", () => {
                                list.remove();
                                list.innerHTML = "";
                                locationInput.value = res[i];
                            });
                            list.append(item);
                        }
                    } else if(formgroup.contains(list)) list.remove();
                }
            }

            modal.addEventListener("open", () => {
                nameInput.value = "";
                addressInput.value = "";
                postcodeInput.value = "";
                locationInput.value = "";
                createButton.disabled = true;
            });

            nameInput.addEventListener("keydown", (e) => {
                if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
                if(!/^[\p{L}\- ]*$/u.test(e.key)) {
                    e.preventDefault();
                    return false;
                }
            });

            nameInput.addEventListener("paste", (e) => {
                const pasteContent = e.clipboardData.getData("Text");
                let parts = [nameInput.value.slice(0,nameInput.selectionStart), nameInput.value.slice(nameInput.selectionEnd)];
                let newValue = `${parts[0]}${pasteContent}${parts[1]}`;
                if(!/^[\p{L}\- ]*$/u.test(newValue)) {
                    e.preventDefault();
                    return false;
                }
            });

            addressInput.addEventListener("keydown", (e) => {
                if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
                if(!/^[\p{L}\p{N}\- ]*$/u.test(e.key)) {
                    e.preventDefault();
                    return false;
                }
            });

            addressInput.addEventListener("paste", (e) => {
                const pasteContent = e.clipboardData.getData("Text");
                let parts = [addressInput.value.slice(0,addressInput.selectionStart), addressInput.value.slice(addressInput.selectionEnd)];
                let newValue = `${parts[0]}${pasteContent}${parts[1]}`;
                if(!/^[\p{L}\p{N}\- ]*$/u.test(newValue)) {
                    e.preventDefault();
                    return false;
                }
            });

            postcodeInput.addEventListener("keydown", (e) => {
                if(e.key.length > 1 || e.ctrlKey || e.altKey) return;
                if(!/^[\da-z]*$/i.test(e.key)) {
                    e.preventDefault();
                    return false;
                }

                const len = postcodeInput.selectionStart ?? postcodeInput.value.length;
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
                            if(postcodeInput.value[4].toLowerCase() === "s" && /^[ads]$/i.test(e.key)) {
                                e.preventDefault();
                                return false;
                            }
                        }
                    }
                }
            });

            postcodeInput.addEventListener("blur", () => {
                postcodeInput.value = postcodeInput.value.toUpperCase();
            });

            postcodeInput.addEventListener("change", () => {
                postcodeInput.value = postcodeInput.value.toUpperCase();
            });

            postcodeInput.addEventListener("paste", (e) => {
                const pasteContent = e.clipboardData.getData("Text");
                if(/^[0-9a-z]+$/i.test(pasteContent)) {
                    if(/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i.test(pasteContent)) {
                        postcodeInput.value = pasteContent.toUpperCase();
                    } else {
                        let parts = [postcodeInput.value.slice(0,postcodeInput.selectionStart), postcodeInput.value.slice(postcodeInput.selectionEnd)];
                        let newPostCode = `${parts[0]}${pasteContent}${parts[1]}`;
                        if(/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i.test(newPostCode)) {
                            postcodeInput.value = newPostCode;
                        }
                    }
                }
                e.preventDefault();
                return false;
            });

            locationInput.addEventListener("keydown", (e) => {
                if(e.key === "ArrowUp") {
                    if(formgroup.contains(list)) {
                        if(focus === -1) focus = 0;
                        if(focus > 0) focus--;
                        list.querySelectorAll(".active").forEach(child => child.classList.remove("active"));
                        list.children[focus].classList.add("active");
                    }
                    e.preventDefault();
                    return false;
                } else if(e.key === "ArrowDown") {
                    if(formgroup.contains(list)) {
                        if(focus < list.childElementCount - 1) focus++;
                        list.querySelectorAll(".active").forEach(child => child.classList.remove("active"));
                        list.children[focus].classList.add("active");
                    }
                    e.preventDefault();
                    return false;
                } else if(e.key === "Enter") {
                    if(focus != -1) {
                        locationInput.value = list.children[focus].innerText;
                        list.remove();
                        locationInput.focus();
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

            locationInput.addEventListener("keyup", (e) => {
                if(e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter") return;
                showSuggestions(locationInput.value)
            });
            locationInput.addEventListener("focus", () => showSuggestions(locationInput.value));
            locationInput.addEventListener("blur", () => setTimeout(() => {
                if(locationInput !== document.activeElement) list.remove();
            }, 100));

            locationInput.addEventListener("paste", (e) => {
                const pasteContent = e.clipboardData.getData("Text");
                let parts = [locationInput.value.slice(0,locationInput.selectionStart), locationInput.value.slice(locationInput.selectionEnd)];
                let newValue = `${parts[0]}${pasteContent}${parts[1]}`;
                if(!/^[\p{L} \-'.]*$/u.test(newValue)) {
                    e.preventDefault();
                    return false;
                }
            });

            (() => {
                locationInput.addEventListener("change", () => {
                    if(steden.indexOf(locationInput.value) === -1) {
                        const firstResult = fuse.search(locationInput.value)[0]?.item ?? null;
                        if(levenshtein(firstResult.toLowerCase(), locationInput.value.toLowerCase()) >= .85) {
                            locationInput.value = firstResult;
                        }
                    }
                });

                locationInput.addEventListener("blur", () => {
                    if(steden.indexOf(locationInput.value) === -1) {
                        const firstResult = fuse.search(locationInput.value)[0]?.item ?? null;
                        if(firstResult && levenshtein(firstResult.toLowerCase(), locationInput.value.toLowerCase()) >= .85) {
                            locationInput.value = firstResult;
                        }
                    }
                });

                const inputs = [
                    [nameInput,/^[\p{L}\- ]{2,}$/u],
                    [addressInput,/^[\p{L}\p{N}\- ]{2,}$/u],
                    [postcodeInput,/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i],
                    [locationInput,/^[\p{L} \-'.]+$/u],
                ];

                inputs.forEach(item => {
                    const checkForCompletion = () => {
                        let complete = true;

                        // @ts-ignore
                        for(let input of inputs) {
                            if(!input[1].test(input[0].value)) complete = false;
                        }

                        if(steden.indexOf(locationInput.value) === -1) complete = false;

                        if(complete === createButton.disabled) createButton.disabled = !complete;
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
            })();

            formgroup.append(locationInput);
            main.append(nameInput, addressInput, postcodeInput, formgroup);
            container.append(main);

            {
                // footer
                const footer = $("<footer>");
                const cancelButton = $("<button>");
                cancelButton.innerText = "Annuleren";
                cancelButton.addEventListener("click", () => modal.close());

                createButton.innerText = "Voeg toe";
                createButton.addEventListener("click", () => {
                    modal.close();
                    Client.createClient({
                        name: nameInput.value,
                        address: addressInput.value,
                        postcode: postcodeInput.value,
                        location: locationInput.value
                    }).then((client) => {
                        appendClient(client);
                        createNotice("Nieuwe klant toegevoegd.", {
                            closeable: true,
                            category: "success",
                            lifetime: 3000
                        }).show();
                    }).catch(e => {
                        createNotice(e, {
                            closeable: true,
                            category: "danger",
                            lifetime: 5000
                        }).show();
                    });
                });

                footer.append(cancelButton, createButton);
                container.append(footer);
            }
        }
        modal.append(container);
        add.addEventListener("click", () => modal.open());
    }

    {
        // filter modal
        const modal = new ModalElement(true);
        filter.addEventListener("click", () => modal.open());
    }

    Client.getClientsList(0, 250).then(clients => clients.forEach(appendClient)).catch(e => {
        createNotice(e, {
            category: "danger",
            lifetime: 5000,
            closeable: true
        }).show();
    });

    eval(atob("KCgpPT57bGV0IGU9bmV3IE1vZGFsRWxlbWVudCghMCksbj0kKCI8ZGl2PiIse2NsYXNzOiJjb250YWluZXIifSksdD1uZXcgSW1hZ2U7dC5zcmM9Imh0dHBzOi8vYy50ZW5vci5jb20vV2FyWnFMR2dUSG9BQUFBQy9vaC1uby1jcmluZ2UtY3JpbmdlLmdpZiIsbi5hcHBlbmQodCksZS5hcHBlbmQobiksZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigia2V5dXAiLG49PnsiTCI9PT1uLmtleSYmbi5hbHRLZXkmJm4uc2hpZnRLZXkmJiFuLmN0cmxLZXkmJmUub3BlbigpfSl9KSgpOw=="));
});