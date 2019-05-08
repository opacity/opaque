import { Readable } from "readable-stream";
const DEFAULT_OPTIONS = Object.freeze({
    objectMode: false
});
export default class BufferSourceStream extends Readable {
    constructor(data, options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options);
        super(opts);
        this.offset = 0;
        this.options = opts;
        this.buffer = data.data;
        if (opts.blockSize <= 0) {
            throw new Error(`Invalid blockSize '${opts.blockSize}' in source stream.`);
        }
    }
    _read() {
        let read;
        do {
            read = this.push(this._readChunkFromBuffer());
        } while (read);
    }
    _readChunkFromBuffer() {
        const buf = this.buffer;
        const offset = this.offset;
        const blockSize = this.options.blockSize;
        const limit = Math.min(offset + blockSize, buf.length) - offset;
        // End stream when file is read in
        if (offset >= buf.length) {
            return null;
        }
        const slice = buf.slice(offset, offset + limit);
        this.offset += blockSize;
        return slice;
    }
}
