type Listener = (data?: any) => void;

class EventEmitter {
    private events: { [key: string]: Listener[] } = {};

    on(event: string, listener: Listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return () => this.off(event, listener);
    }

    off(event: string, listener: Listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    emit(event: string, data?: any) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(data));
    }
}

export const eventBus = new EventEmitter();
