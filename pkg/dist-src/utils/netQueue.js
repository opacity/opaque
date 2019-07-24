import { EventEmitter } from "events";
import debounce from "debounce";
class NetQueue extends EventEmitter {
    constructor({ fetch, update, data = {}, timeout = 1000 }) {
        super();
        this.updating = false;
        this.queue = [];
        this.types = {};
        this.data = {};
        this.push = ({ type, payload }) => {
            this.queue.push({ type, payload });
            this._process();
        };
        this.addType = ({ type, handler }) => {
            this.types[type] = handler;
        };
        this._process = debounce(async () => {
            if (this.updating)
                return;
            this.updating = true;
            const queueCopy = Object.assign([], this.queue);
            this.result = await Promise.resolve(this._fetch());
            for (let { type, payload } of queueCopy) {
                if (this.types[type])
                    this.result = await Promise.resolve(this.types[type](this.result, payload));
                else
                    throw new Error("unknown type: " + type);
                this.queue.shift();
            }
            await Promise.resolve(this._update(this.result));
            this.updating = false;
            this.emit("update", this.result);
            if (this.queue.length)
                this._process();
        }, this._timeout);
        this._fetch = fetch;
        this._update = update;
        this.data = data;
        this._timeout = timeout;
    }
}
export { NetQueue };
