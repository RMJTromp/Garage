interface ClientData {
    id?: number,
    name?: string,
    address?: string,
    postcode?: string,
    location?: string
}

class Client extends EventEmitter {

    private static cache : Client[] = [];
    private readonly id: number;
    private name: string;
    private address: string;
    private postcode: string;
    private location: string;

    static get(id : number) : Promise<Client> {
        return new Promise((resolve, reject) => {
            if(typeof id !== "number" || id < 1) reject("Ongeldige client ID opgegeven.");
            /**@ts-ignore*/
            let client = Client.cache.find(client => client.getId() === id);
            if(client) resolve(client);
            else {
                let xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                    if (this.readyState === 4 && this.status === 200) {
                        try {
                            const response = JSON.parse(xhttp.responseText);
                            if(response.success) resolve(new Client(response.response));
                            else reject(response.response);
                        } catch (e) {
                            if(e instanceof SyntaxError) {
                                let div = $("<div>");
                                div.innerHTML = xhttp.responseText;
                                console.error("Response: ", div.innerText);
                            }
                            reject("Er is een fout opgetreden bij het ophalen van klantinformatie.");
                            console.error(e);
                        }
                    }
                };
                xhttp.open("GET", `/api/klant?id=${id}`, true);
                xhttp.send();
                setTimeout(() => reject("Timed Out"), 10000);
            }
        });
    }

    public static getClientsList(offset : number = 0, limit : number = 100) : Promise<Client[]> {
        return new Promise((resolve, reject) => {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    try {
                        const response = JSON.parse(xhttp.responseText);
                        if(response.success) {
                            const clients = response.response;
                            resolve([...clients].map(data => new Client(data)));
                        } else reject(response.response);
                    } catch (e) {
                        if(e instanceof SyntaxError) {
                            let div = $("<div>");
                            div.innerHTML = xhttp.responseText;
                            console.error("Response: ", div.innerText);
                        }
                        reject("Er is een fout opgetreden bij het ophalen van de klantenlijst.");
                        console.error(e);
                    }
                }
            };
            xhttp.open("GET", "/api/klanten", true);
            xhttp.send();
            setTimeout(() => reject("Timed Out"), 10000);
        });
    }

    public static createClient(data : ClientData): Promise<Client> {
        return new Promise((resolve, reject) => {
            const formdata = new FormData();

            if(data.name) {
                if(!/^[\p{L}\- ]{2,}$/u.test(data.name.trim())) return reject("Ongeldige naam opgegeven.");
                formdata.set("name", data.name.trim())
            } else return reject("Er werd geen naam opgegeven");

            if(data.address) {
                if(!/^[\p{L}\p{N}\- ]{2,}$/u.test(data.address.trim())) return reject("Ongeldige adres opgegeven.");
                formdata.set("address", data.address.trim())
            } else return reject("Er werd geen adres opgegeven");

            if(data.postcode) {
                if(!/^\d{4}[a-z]{2}$/i.test(data.postcode.trim())) return reject("Ongeldige postcode opgegeven.");
                formdata.set("postcode", data.postcode.trim())
            } else return reject("Er werd geen postcode opgegeven");

            if(data.location) {
                if(!/^[\p{L} \-'.]+$/u.test(data.location.trim())) return reject("Ongeldige plaats opgegeven.");
                formdata.set("location", data.location.trim())
            } else return reject("Er werd geen plaats opgegeven");


            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState === 4 && this.status === 200) {
                    try {
                        const response = JSON.parse(xhttp.responseText);
                        if(response.success) resolve(new Client(response.response));
                        else reject(response.response);
                    } catch (e) {
                        if(e instanceof SyntaxError) {
                            let div = $("<div>");
                            div.innerHTML = xhttp.responseText;
                            console.error("Response: ", div.innerText);
                        }
                        reject("Er is een fout opgetreden tijdens het aanmaken van een nieuwe klant.");
                        console.error(e);
                    }
                }
            };
            xhttp.open("POST", `/api/klant`, true);
            xhttp.send(formdata);
            setTimeout(() => reject("Timed Out"), 10000);
        });
    }

    private constructor(data : ClientData) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.address = data.address;
        this.postcode = data.postcode;
        this.location = data.location;

        Client.cache.push(this);
    }

    public getId() : number {
        return this.id;
    }

    public getName() : string {
        return this.name;
    }

    public setName(name) : Promise<Client> {
        return this.updateData({name});
    }

    public getAddress() : string {
        return this.address;
    }

    public setAddress(address) : Promise<Client> {
        return this.updateData({address});
    }

    public getPostcode() : string {
        return this.postcode;
    }

    public setPostcode(postcode) : Promise<Client> {
        return this.updateData({postcode});
    }

    public getLocation() : string {
        return this.location;
    }

    public setLocation(location) : Promise<Client> {
        return this.updateData({location});
    }

    public getClientData() : ClientData {
        return {
            id: this.id,
            name: this.name,
            address: this.address,
            postcode: this.postcode,
            location: this.location
        }
    }

    public updateData(data : ClientData) : Promise<Client> {
        return new Promise((resolve, reject) => {
            let changes = {};

            if(data.name) {
                if(!/^[\p{L}\- ]{2,}$/u.test(data.name.trim())) return reject("Ongeldige naam opgegeven.");
                changes['name'] = data.name.trim();
            }

            if(data.address) {
                if(!/^[\p{L}\p{N}\- ]{2,}$/u.test(data.address.trim())) return reject("Ongeldige adres opgegeven.");
                changes['address'] = data.address.trim();
            }

            if(data.postcode) {
                if(!/^[1-9][0-9]{3}(?!sa|sd|ss)[a-z]{2}$/i.test(data.postcode.trim())) return reject("Ongeldige postcode opgegeven.");
                changes['postcode'] = data.postcode.trim();
            }

            if(data.location) {
                if(!/^[\p{L} \-'.]+$/u.test(data.location.trim())) return reject("Ongeldige plaats opgegeven.");
                changes['location'] = data.location.trim();
            }


            if(Object.keys(changes).length > 0) {
                let xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = () => {
                    if (xhttp.readyState === 4 && xhttp.status === 200) {
                        try {
                            const response = JSON.parse(xhttp.responseText);
                            if(response.success) {
                                const client : ClientData = response.response;
                                this.name = client.name;
                                this.address = client.address;
                                this.postcode = client.postcode;
                                this.location = client.location;

                                resolve(this);
                                this.emit("update")
                            } else reject(response.response);
                        } catch (e) {
                            if(e instanceof SyntaxError) {
                                let div = $("<div>");
                                div.innerHTML = xhttp.responseText;
                                console.error("Response: ", div.innerText);
                            }
                            reject("Er is een fout opgetreden tijdens het wijzigen van de klant.");
                            console.error(e);
                        }
                    }
                };
                xhttp.open("PUT", `/api/klant?id=${this.id}`, true);
                xhttp.setRequestHeader("Content-Type", "application/json")
                xhttp.send(JSON.stringify(changes));
                setTimeout(() => reject("Timed Out"), 10000);
            } else resolve(this);
        });
    }

    delete() : Promise<Client> {
        return new Promise((resolve, reject) => {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = () => {
                if (xhttp.readyState === 4 && xhttp.status === 200) {
                    try {
                        const response = JSON.parse(xhttp.responseText);
                        if(response.success) {
                            Client.cache = Client.cache.filter(client => client.getId() !== this.id);
                            resolve(this);
                            this.emit("delete");
                        } else reject(response.response);
                    } catch (e) {

                        reject("Er is een fout opgetreden tijdens het verwijderen van de client");
                    }
                }
            };
            xhttp.open("DELETE", `/api/klant?id=${this.id}`, true);
            xhttp.send();
            setTimeout(() => reject("Timed Out"), 10000);
        });
    }

}