interface Listener {
    (...args)
}
class EventEmitter {

    private events = {};

    protected constructor() {}

    on(event : string, listener : Listener) {
        if(typeof event === "string" && event.length > 0 && typeof listener === "function") {
            if(!this.events[event]) this.events[event] = [];
            this.events[event].push(listener);
        }
    }

    once(event : string, listener : Listener) {
        this.on(event, (...args) => {
            listener.apply(this, args);
            this.removeListener(event, listener);
        })
    }

    removeListener(event : string, listener : Listener) {
        if(this.events[event]) {
            let index = this.events[event].indexOf(listener);
            if(index > -1) this.events[event].splice(index, 1);
        }
    }

    emit(event : string, ...args) {
        if(this.events[event]) {
            this.events[event].forEach(listener => listener.apply(this, args));
        }
    }

}