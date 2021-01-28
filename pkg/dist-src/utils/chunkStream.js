import { TransformStream } from "web-streams-polyfill/ponyfill";
export class Uint8ArrayChunkStream {
    constructor(size, writableStrategy, readableStrategy, hooks) {
        this._l = 0;
        this._hooks = hooks;
        this._size = size;
        this._buffer = new Uint8Array(size);
        const t = this;
        this._transformer = new TransformStream({
            flush(controller) {
                var _a, _b;
                const b = t._buffer.slice(0, t._l);
                (_a = t === null || t === void 0 ? void 0 : t._hooks) === null || _a === void 0 ? void 0 : _a.flush(b);
                if (t._l != 0) {
                    (_b = t === null || t === void 0 ? void 0 : t._hooks) === null || _b === void 0 ? void 0 : _b.enqueue(b);
                    controller.enqueue(b);
                }
                delete t._buffer;
                delete t._size;
                t._l = 0;
            },
            transform: t._transform.bind(t),
        }, writableStrategy, readableStrategy);
        this.readable = this._transformer.readable;
        this.writable = this._transformer.writable;
    }
    _transform(chunk, controller) {
        var _a, _b;
        (_a = this === null || this === void 0 ? void 0 : this._hooks) === null || _a === void 0 ? void 0 : _a.transform(chunk);
        let written = 0;
        const numberOfChunks = Math.floor((this._l + chunk.length) / this._size);
        for (let bufIndex = 0; bufIndex < numberOfChunks; bufIndex++) {
            const sl = this._l;
            const l = this._size - this._l;
            for (let n = 0; n < this._size - sl; n++) {
                this._buffer[this._l] = chunk[written + n];
                this._l++;
            }
            written += l;
            (_b = this === null || this === void 0 ? void 0 : this._hooks) === null || _b === void 0 ? void 0 : _b.enqueue(this._buffer);
            controller.enqueue(this._buffer);
            this._buffer = new Uint8Array(this._size);
            this._l = 0;
        }
        for (let i = written; i < chunk.length; i++) {
            this._buffer[this._l] = chunk[i];
            this._l++;
        }
    }
}
