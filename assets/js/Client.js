class Client extends EventEmitter {

    /** @type {Client[]} */
    static cache = [];

    /**
     * @param {number} id
     * @returns {Promise<Client>}
     */
    static get(id) {
        return new Promise((resolve, reject) => {
            if(typeof id !== "number" || id < 1) reject("Ongeldige client ID opgegeven.");
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

    /**
     * @param {number} offset = 0
     * @param {number} limit = 100
     * @returns {Promise<Client[]>}
     */
    static getClientsList(offset = 0, limit = 100) {
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

    /**
     * @param {Object} data
     * @param {string} data.name
     * @param {string} data.address
     * @param {string} data.postcode
     * @param {string} data.location
     * @returns {Promise<Client>}
     */
    static createClient(data) {
        return new Promise((resolve, reject) => {
            const formdata = new FormData();

            if(data.name) {
                if(typeof data.name !== "string" || !/^[\p{L}\- ]{2,}$/u.test(data.name.trim())) return reject("Ongeldige naam opgegeven.");
                formdata.set("name", data.name.trim())
            } else return reject("Er werd geen naam opgegeven");

            if(data.address) {
                if(typeof data.address !== "string" || !/^[\p{L}\p{N}\- ]{2,}$/u.test(data.address.trim())) return reject("Ongeldige adres opgegeven.");
                formdata.set("address", data.address.trim())
            } else return reject("Er werd geen adres opgegeven");

            if(data.postcode) {
                if(typeof data.postcode !== "string" || !/^\d{4}[a-z]{2}$/i.test(data.postcode.trim())) return reject("Ongeldige postcode opgegeven.");
                formdata.set("postcode", data.postcode.trim())
            } else return reject("Er werd geen postcode opgegeven");

            if(data.location) {
                if(typeof data.location !== "string" || !/^[\p{L} \-'.]+$/u.test(data.location.trim())) return reject("Ongeldige plaats opgegeven.");
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

    /**
     * @param {Object} data
     * @param {string} data.name
     * @param {string} data.address
     * @param {string} data.postcode
     * @param {string} data.location
     */
    constructor(data) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.address = data.address;
        this.postcode = data.postcode;
        this.location = data.location;

        Client.cache.push(this);
    }

    /** @returns {string} */
    getId() {
        return this.id;
    }

    /** @returns {string} */
    getName() {
        return this.name;
    }

    /**
     * @param {string} name
     * @returns {Promise<Client>}
     */
    setName(name) {
        return this.updateData({name});
    }

    /** @returns {string} */
    getAddress() {
        return this.address;
    }

    /**
     * @param {string} address
     * @returns {Promise<Client>}
     */
    setAddress(address) {
        return this.updateData({address});
    }

    /** @returns {string} */
    getPostcode() {
        return this.postcode;
    }

    /**
     * @param {string} postcode
     * @returns {Promise<Client>}
     */
    setPostcode(postcode) {
        return this.updateData({postcode});
    }

    /** @returns {string} */
    getLocation() {
        return this.location;
    }

    /**
     * @param {string} location
     * @returns {Promise<Client>}
     */
    setLocation(location) {
        return this.updateData({location});
    }

    /**
     * @param {Object} data
     * @param {string} [data.name]
     * @param {string} [data.address]
     * @param {string} [data.postcode]
     * @param {string} [data.location]
     * @returns {Promise<Client>}
     */
    updateData(data) {
        return new Promise((resolve, reject) => {
            let changes = {};

            if(data.name) {
                if(typeof data.name !== "string" || !/^[\p{L}\- ]{2,}$/u.test(data.name.trim())) return reject("Ongeldige naam opgegeven.");
                changes.name = data.name.trim();
            }

            if(data.address) {
                if(typeof data.address !== "string" || !/^[\p{L}\p{N}\- ]{2,}$/u.test(data.address.trim())) return reject("Ongeldige adres opgegeven.");
                changes.address = data.address.trim();
            }

            if(data.postcode) {
                if(typeof data.postcode !== "string" || !/^\d{4}[a-z]{2}$/i.test(data.postcode.trim())) return reject("Ongeldige postcode opgegeven.");
                changes.postcode = data.postcode.trim();
            }

            if(data.location) {
                if(typeof data.location !== "string" || !/^[\p{L} \-'.]+$/u.test(data.location.trim())) return reject("Ongeldige plaats opgegeven.");
                changes.location = data.location.trim();
            }


            if(Object.keys(changes).length > 0) {
                let xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = () => {
                    if (xhttp.readyState === 4 && xhttp.status === 200) {
                        try {
                            const response = JSON.parse(xhttp.responseText);
                            if(response.success) {
                                resolve(this);
                                this.emit("update")
                            } else reject(response.response);
                        } catch (e) {
                            reject("Er is een fout opgetreden tijdens het wijzigen van de klant.");
                            console.error(e);
                        }
                    }
                };
                xhttp.open("PUT", `/api/klant?id=${this.id}`, true);
                xhttp.send(JSON.stringify(changes));
                setTimeout(() => reject("Timed Out"), 10000);
            } else resolve(this);
        });
    }

    /** @returns {Promise<Client>} */
    delete() {
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