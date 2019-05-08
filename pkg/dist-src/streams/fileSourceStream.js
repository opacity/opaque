import { Readable } from "readable-stream";
const DEFAULT_OPTIONS = Object.freeze({
    objectMode: false
});
export default class FileSourceStream extends Readable {
    constructor(blob, options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options);
        console.log("Starting file source stream", blob);
        super(opts);
        this.offset = 0;
        this.options = opts;
        this.blob = blob;
        this.reader = new FileReader();
        this._onChunkRead = this._onChunkRead.bind(this);
        if (opts.blockSize <= 0) {
            throw new Error(`Invalid blockSize '${opts.blockSize}' in source stream.`);
        }
    }
    _read() {
        if (this.reader.readyState !== FileReader.LOADING) {
            this._readChunkFromBlob();
        }
    }
    _readChunkFromBlob() {
        const blob = this.blob;
        const offset = this.offset;
        const blockSize = this.options.blockSize;
        const limit = Math.min(offset + blockSize, blob.size);
        // End stream when file is read in
        if (offset >= blob.size) {
            return this.push(null);
        }
        const chunk = blob.slice(offset, limit, "application/octet-stream");
        this.offset += blockSize;
        this.reader.onload = this._onChunkRead;
        this.reader.readAsArrayBuffer(chunk);
    }
    _onChunkRead(event) {
        const chunk = event.target.result;
        if (this.push(new Uint8Array(chunk))) {
            this._read();
        }
    }
}
