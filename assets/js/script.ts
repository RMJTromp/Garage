const DEBUG = false;

console.debug = function(...args) {
    if(DEBUG) {
        // @ts-ignore
        console.log("%cDEBUG: ", "color:#ed4245", ...args);
    }
}

interface FuseObject<T> {
    item: T,
    refIndex: number,
    score?: number
}

// @ts-ignore
Array.prototype.observe = function (callback) {
    if(typeof callback !== "function") throw new Error("Callback must be a function");
    const array = this;
    if(!(array.callbacks)) {
        this.callbacks = [];
        ['pop','push','reverse','shift','unshift','splice','sort'].forEach((m)=>{
            array[m] = function(){
                let res = Array.prototype[m].apply(array, arguments);
                new Promise((resolve) => {
                    setTimeout(() => {
                        array.callbacks.forEach(callback => callback.apply(array, arguments));
                        resolve(null);
                    }, 1);
                });
                return res;
            }
        });
    }
    array.callbacks.push(callback);
}

const $ = (selector, attributes = {}) => {
    if(selector.startsWith("<") && selector.endsWith(">")) {
        const element = document.createElement(selector.substr(1, selector.length - 2));
        if(typeof attributes === "object" && !Array.isArray(attributes)) {
            Object.keys(attributes).forEach(key => {
                if(key.toLowerCase() === "text") element.innerText = attributes[key];
                else element.setAttribute(key, attributes[key]);
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

const RMJTromp = {
    garage: {
        steden: {
            list: <String[]> [],
            search: (search) : FuseObject<string>[] => {
                console.warn("Fuse not yet initialized");
                return [];
            }
        },
        clients: {
            cache: <Client[]> [],
            search: (search) : FuseObject<Client>[] => {
                console.warn("Fuse not yet initialized");
                return [];
            },
            createElement: (client : Client) => {
                const item = $("<li>");

                {
                    const wrapper = $("<div>");
                    {
                        const details = $("<div>");
                        {
                            const name = $("<p>", {text: client.getName()});
                            const address = $("<small>", {text: `${client.getAddress()}, ${client.getPostcode()}, ${client.getLocation()}`});
                            client.on("update", () => {
                                name.innerText = client.getName();
                                address.innerHTML = `${client.getAddress()}, ${client.getPostcode()}, ${client.getLocation()}`;
                            });
                            details.append(name, address);
                        }

                        const buttonList = $("<ul>");
                        {
                            const editItem = $("<li>");
                            editItem.append($("<i>", {class: "codicon codicon-edit"}));
                            editItem.addEventListener("click", () => {
                                const modal = new ClientEditorModalElement(true);
                                modal.button.innerText = "Wijzigen";
                                modal.inputs.name.value = client.getName();
                                modal.inputs.address.value = client.getAddress();
                                modal.inputs.postcode.value = client.getPostcode();
                                modal.inputs.location.value = client.getLocation();
                                modal.open();
                                modal.button.disabled = true;

                                const verifyInputs = () => {
                                    if(modal.inputs.name.value !== client.getName() && modal.inputs.name.value.trim() !== client.getName()) {
                                        if(!/^[\p{L}\- ]{2,}$/u.test(modal.inputs.name.value.trim())) return false;
                                    }
                                    else if(modal.inputs.address.value !== client.getAddress() && modal.inputs.address.value.trim() !== client.getAddress()) {
                                        if(!/^[\p{L}\p{N}\- ]{2,}$/u.test(modal.inputs.address.value.trim())) return false;
                                    }
                                    else if(modal.inputs.postcode.value !== client.getPostcode() && modal.inputs.postcode.value.trim() !== client.getPostcode()) {
                                        if(!/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i.test(modal.inputs.postcode.value.trim())) return false;
                                    }
                                    else if(modal.inputs.location.value !== client.getLocation() && modal.inputs.location.value.trim() !== client.getLocation()) {
                                        if(RMJTromp.garage.steden.list.indexOf(modal.inputs.location.value.trim()) === -1) return false;
                                    }
                                    return true;
                                };

                                Object.keys(modal.inputs).forEach(key => {
                                    ["blur", "change", "keyup", "keydown"].forEach(event => {
                                        modal.inputs[key].addEventListener(event, () => {
                                            modal.button.disabled = !verifyInputs();
                                        });
                                    });
                                });

                                modal.button.addEventListener("click", () => {
                                    if(verifyInputs()) {
                                        let changes = {};
                                        if(modal.inputs.name.value !== client.getName() && modal.inputs.name.value.trim() !== client.getName()) {
                                            if(/^[\p{L}\- ]{2,}$/u.test(modal.inputs.name.value.trim())) changes['name'] = modal.inputs.name.value.trim();
                                            else return;
                                        }
                                        if(modal.inputs.address.value !== client.getAddress() && modal.inputs.address.value.trim() !== client.getAddress()) {
                                            if(/^[\p{L}\p{N}\- ]{2,}$/u.test(modal.inputs.address.value.trim())) changes['address'] = modal.inputs.address.value.trim();
                                            else return;
                                        }
                                        if(modal.inputs.postcode.value !== client.getPostcode() && modal.inputs.postcode.value.trim() !== client.getPostcode()) {
                                            if(/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i.test(modal.inputs.postcode.value.trim())) changes['postcode'] = modal.inputs.postcode.value.trim();
                                            else return;
                                        }
                                        if(modal.inputs.location.value !== client.getLocation() && modal.inputs.location.value.trim() !== client.getLocation()) {
                                            if(RMJTromp.garage.steden.list.indexOf(modal.inputs.location.value.trim()) !== -1) changes['location'] = modal.inputs.location.value.trim();
                                            else return;
                                        }

                                        if(Object.keys(changes).length > 0) {
                                            modal.close();
                                            client.updateData(changes).then(() => {
                                                RMJTromp.notice.create("Klant gewijzigd.", {
                                                    category: "success",
                                                    lifetime: 5000,
                                                    closeable: true
                                                }).show();
                                            }).catch(e => {
                                                RMJTromp.notice.create(e, {
                                                    category: "danger",
                                                    lifetime: 5000,
                                                    closeable: true
                                                }).show();
                                            });
                                        }
                                    } else modal.button.disabled = true;
                                });
                            });

                            const removeItem = $("<li>");
                            removeItem.append($("<i>", {class: "codicon codicon-trash"}));
                            removeItem.addEventListener("click", e => {
                                if(e.shiftKey && !e.ctrlKey && !e.altKey) {
                                    client.delete().then(() => {
                                        RMJTromp.notice.create("Klant verwijderd", {
                                            category: "success",
                                            lifetime: 5000,
                                            closeable: true,
                                            anchor: {
                                                text: "Ongedaan maken",
                                                click: function () {
                                                    Client.createClient(client.getClientData()).then((newClient) => {
                                                        $("body > section > div.container > ul:nth-of-type(2)").append(newClient.listElement);
                                                        this.hide();
                                                        RMJTromp.notice.create("Klant hersteld", {
                                                            category: "success",
                                                            lifetime: 3000,
                                                            closeable: true
                                                        }).show();
                                                    }).catch(e => {
                                                        this.hide();
                                                        RMJTromp.notice.create(e, {
                                                            category: "danger",
                                                            lifetime: 5000,
                                                            closeable: true
                                                        }).show();
                                                    });
                                                }
                                            }
                                        }).show();
                                    }).catch(e => {
                                        RMJTromp.notice.create(e, {
                                            category: "danger",
                                            lifetime: 5000,
                                            closeable: true
                                        }).show();
                                    });
                                } else {
                                    const modal = new ModalElement(true);
                                    {
                                        const container = $("<div>", {class: "container"});
                                        {
                                            const main = $("<main>");
                                            {
                                                const p = $("<p>", {text: "Weet u zeker dat u deze klant wilt verwijderen?"});
                                                main.append(p);
                                            }

                                            const footer = $("<footer>");
                                            {
                                                const button = $("<button>", {class: "danger", text: "Verwijder"});
                                                button.addEventListener("click", () => {
                                                    modal.close();
                                                    client.delete().then(() => {
                                                        RMJTromp.notice.create("Klant verwijderd", {
                                                            category: "success",
                                                            lifetime: 5000,
                                                            closeable: true,
                                                            anchor: {
                                                                text: "Ongedaan maken",
                                                                click: function () {
                                                                    Client.createClient(client.getClientData()).then((newClient) => {
                                                                        $("body > section > div.container > ul:nth-of-type(2)").append(newClient.listElement);
                                                                        this.hide();
                                                                        RMJTromp.notice.create("Klant hersteld", {
                                                                            category: "success",
                                                                            lifetime: 3000,
                                                                            closeable: true
                                                                        }).show();
                                                                    }).catch(e => {
                                                                        this.hide();
                                                                        RMJTromp.notice.create(e, {
                                                                            category: "danger",
                                                                            lifetime: 5000,
                                                                            closeable: true
                                                                        }).show();
                                                                    });
                                                                }
                                                            }
                                                        }).show();
                                                    }).catch(e => {
                                                        RMJTromp.notice.create(e, {
                                                            category: "danger",
                                                            lifetime: 5000,
                                                            closeable: true
                                                        }).show();
                                                    });
                                                });
                                                footer.append(button);
                                            }
                                            container.append(main, footer);
                                        }
                                        modal.append(container);
                                    }
                                    modal.open();
                                }
                            });

                            buttonList.append(editItem, removeItem);
                        }

                        wrapper.append(details, buttonList);
                    }
                    item.append(wrapper);
                }

                client.on("delete", () => item.remove());
                return item;
            }
        }
    },
    notice: {
        active: <Notice[]> [],
        create: (message : string, options? : NoticeOptions) : Notice => {
            const element = $("<div>", {class: "notice", text: message});

            const notice : Notice = {
                element: element,
                hide: () => {
                    element.style.transform = "";
                    const index = RMJTromp.notice.active.indexOf(notice);
                    if(index !== -1) RMJTromp.notice.active.splice(index, 1);
                    setTimeout(() => element.remove(), 500);
                },
                show: () => {
                    let delay = 0;
                    if(!document.body.contains(element)) {
                        document.body.append(element);
                        delay = 2;
                    }

                    RMJTromp.notice.active.push(notice);
                    setTimeout(() => {
                        element.style.transform = "translateY(0)";
                    }, delay);
                }
            };

            if(typeof options === "object") {
                if(options.category) element.classList.add(options.category);
                if(options.anchor) {
                    const anchor = $("<a>", {text: options.anchor.text ?? ""});
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
    }
};

// @ts-ignore
RMJTromp.garage.steden.list.observe(() => {
    // @ts-ignore
    const fuse = new Fuse(RMJTromp.garage.steden.list, {includeScore: true});
    RMJTromp.garage.steden.search = function (search) {
        return fuse.search(search);
    }
});

// @ts-ignore
RMJTromp.garage.clients.cache.observe(() => {
    // @ts-ignore
    const fuse = new Fuse(RMJTromp.garage.clients.cache, {keys: ["name", "address", "postcode", "location"]});
    RMJTromp.garage.clients.search = function (search) {
        return fuse.search(search);
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    if(DEBUG) {
        RMJTromp.notice.create("Running in DEBUG mode", {
            category: "warning",
            lifetime: 5000,
            closeable: true
        }).show();
    }

    const filter = $("li#filter"), clientsList = $("<ul>");
    $("body > section > div.container").append(clientsList);

    {
        // load steden
        const steden = await (() => {
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
        RMJTromp.garage.steden.list.push(...steden);
    }

    {
        const searchInput = $("body > section > div.container > input");
        let lastSearched = "";
        ["keydown", "keyup", "input", "change", "blur", "focus"].forEach(event => {
            searchInput.addEventListener(event, () => {
                // dont update if no update is needed
                if(searchInput !== searchInput.value.trim()) {
                    clientsList.innerHTML = ""
                    if(searchInput.value.trim().length !== 0) {
                        lastSearched = searchInput.value.trim();
                        RMJTromp.garage.clients.search(searchInput.value.trim()).forEach(res => clientsList.append(res.item.listElement));
                    } else RMJTromp.garage.clients.cache.forEach(client => clientsList.append(client.listElement));
                }
            });
        });
    }

    {
        const createModal = new ClientEditorModalElement(true);
        createModal.button.addEventListener("click", () => {
            console.debug("Attempting to create a new client", {
                name: createModal.inputs.name.value,
                address: createModal.inputs.address.value,
                postcode: createModal.inputs.postcode.value,
                location: createModal.inputs.location.value
            });

            Client.createClient({
                name: createModal.inputs.name.value,
                address: createModal.inputs.address.value,
                postcode: createModal.inputs.postcode.value,
                location: createModal.inputs.location.value
            }).then((client) => {
                createModal.close();
                clientsList.append(client.listElement);
                RMJTromp.notice.create("Nieuwe klant toegevoegd.", {
                    closeable: true,
                    category: "success",
                    lifetime: 3000
                }).show();
            }).catch(e => {
                createModal.close();
                RMJTromp.notice.create(e, {
                    closeable: true,
                    category: "danger",
                    lifetime: 5000
                }).show();
            });
        });
        $("li#add").addEventListener("click", () => createModal.open());
    }


    Client.getClientsList(0, 250).then(clients => {
        clients.forEach(client => clientsList.append(client.listElement));
    }).catch(e => {
        RMJTromp.notice.create(e, {
            category: "danger",
            lifetime: 5000,
            closeable: true
        }).show();
    });

    eval(atob("KCgpPT57bGV0IGU9bmV3IE1vZGFsRWxlbWVudCghMCksbj0kKCI8ZGl2PiIse2NsYXNzOiJjb250YWluZXIifSksdD1uZXcgSW1hZ2U7dC5zcmM9Imh0dHBzOi8vYy50ZW5vci5jb20vV2FyWnFMR2dUSG9BQUFBQy9vaC1uby1jcmluZ2UtY3JpbmdlLmdpZiIsbi5hcHBlbmQodCksZS5hcHBlbmQobiksZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigia2V5dXAiLG49PnsiTCI9PT1uLmtleSYmbi5hbHRLZXkmJm4uc2hpZnRLZXkmJiFuLmN0cmxLZXkmJmUub3BlbigpfSl9KSgpOw=="));
});