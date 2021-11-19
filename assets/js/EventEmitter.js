class EventEmitter {

    constructor() {
        this.events = {};
    }


    on(event, listener) {
        if(typeof event === "string" && event.length > 0 && typeof listener === "function") {
            if(!this.events[event]) this.events[event] = [];
            this.events[event].push(listener);
        }
    }

    once(event, listener) {
        this.on(event, ...args => {
            listener.apply(this, ...args);
            this.removeListener(event, listener);
        });
    }

    removeListener(event, listener) {
        if(this.events[event]) {
            let index = this.events[event].indexOf(listener);
            if(index > -1) this.events[event].splice(index, 1);
        }
    }

    emit(event, ...args) {
        if(this.events[event]) {
            this.events[event].forEach(listener => listener.apply(this, ...args));
        }
    }

}

