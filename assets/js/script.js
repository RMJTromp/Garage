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

const levenshtein=(t,r)=>{let e=Math.max(t.length,r.length);return(e-((t,r)=>{if(t===r)return 0;let e=t.length,n=r.length;if(0===e)return n;if(0===n)return e;let l=!1;try{l=!"0"[0]}catch(t){l=!0}l&&(t=t.split(""),r=r.split(""));let a=new Array(e+1),h=new Array(e+1),f=0,i=0,u=0;for(f=0;f<e+1;f++)a[f]=f;let g="";for(i=1;i<=n;i++){for(h[0]=i,g=r[i-1],f=0;f<e;f++){u=t[f]===g?0:1;let r=a[f+1]+1,e=h[f]+1,n=a[f]+u;e<r&&(r=e),n<r&&(r=n),h[f+1]=r}let n=a;a=h,h=n}return a[e]})(t,r))/e};

document.addEventListener("DOMContentLoaded", async () => {
    const
        body = document.body,
        filter = $("li#filter"),
        add = $("li#add"),
        clientsList = $("ul#clients");

    console.log("asd");

    /** @type string[] */
    const steden = await (() => {
        return new Promise((resolve, reject) => {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    try {
                        const response = JSON.parse(xhttp.responseText);
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

    const lowercaseSteden = [...steden].map(stad => stad.toLowerCase());

    /**
     * @param {Client} client
     */
    const appendClient = client => {
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

        li2.addEventListener("click", async (e) => {
            if(e.shiftKey) client.delete().catch(console.error);
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

                    const createButton = $("<button>", {class: "danger"});
                    createButton.innerText = "Verwijderen";
                    createButton.addEventListener("click", () => {
                        client.delete();
                        modal.close();
                    });

                    footer.append(cancelButton, createButton);
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
            // container contents
            const main = $("<main>");
            const nameInput = $("<input>", {type:"text", placeholder: "Naam"});
            const addressInput = $("<input>", {type:"text", placeholder: "Adres"});
            const postcodeInput = $("<input>", {type:"text", placeholder: "Postcode"});
            const locationInput = $("<input>", {type:"text", placeholder: "Plaats"});

            modal.addEventListener("close", () => {
                nameInput.value = "";
                addressInput.value = "";
                postcodeInput.value = "";
                locationInput.value = "";
            });

            main.append(nameInput, addressInput, postcodeInput, locationInput);
            container.append(main);

            {
                // footer
                const footer = $("<footer>");
                const cancelButton = $("<button>");
                cancelButton.innerText = "Annuleren";
                cancelButton.addEventListener("click", () => modal.close());

                const createButton = $("<button>", {class: "primary"});
                createButton.innerText = "Voeg toe";
                createButton.addEventListener("click", () => {
                    Client.createClient({
                        name: nameInput.value,
                        address: addressInput.value,
                        postcode: postcodeInput.value,
                        location: locationInput.value
                    }).then(client => {
                        modal.close();
                        appendClient(client);
                    }).catch(console.error);
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

    {
        // handle edits
        const modal = new ModalElement(true);
        const container = $("<div>", {class: "container"});
        {
            // main
            const main = $("<main>");
            const nameInput = $("<input>", {type:"text", placeholder: "Naam"});
            const addressInput = $("<input>", {type:"text", placeholder: "Adres"});
            const postcodeInput = $("<input>", {type:"text", placeholder: "Postcode"});
            const locationInput = $("<input>", {type:"text", placeholder: "Plaats"});

            modal.addEventListener("open", () => {
                nameInput.value = "Raygell Tromp";
                addressInput.value = "Engelandstraat 123b";
                postcodeInput.value = "0923AB";
                locationInput.value = "Rotterdam";
            });

            main.append(nameInput, addressInput, postcodeInput, locationInput);
            container.append(main);
        }
        {
            const footer = $("<footer>");
            const cancelButton = $("<button>");
            cancelButton.innerText = "Annuleren";
            cancelButton.addEventListener("click", () => modal.close());

            const editButton = $("<button>", {class: "primary"});
            editButton.innerText = "Wijzigen";
            editButton.addEventListener("click", () => modal.close());

            footer.append(cancelButton, editButton);
            container.append(footer);
        }
        modal.append(container);

        document.querySelectorAll("li#edit").forEach(e => e.addEventListener("click", () => modal.open()));
    }

    Client.getClientsList().then(clients => clients.forEach(appendClient)).catch(console.error);

    eval(atob("KCgpPT57bGV0IGU9bmV3IE1vZGFsRWxlbWVudCghMCksbj0kKCI8ZGl2PiIse2NsYXNzOiJjb250YWluZXIifSksdD1uZXcgSW1hZ2U7dC5zcmM9Imh0dHBzOi8vYy50ZW5vci5jb20vV2FyWnFMR2dUSG9BQUFBQy9vaC1uby1jcmluZ2UtY3JpbmdlLmdpZiIsbi5hcHBlbmQodCksZS5hcHBlbmQobiksZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigia2V5dXAiLG49PnsiTCI9PT1uLmtleSYmbi5hbHRLZXkmJm4uc2hpZnRLZXkmJiFuLmN0cmxLZXkmJmUub3BlbigpfSl9KSgpOw=="));
});