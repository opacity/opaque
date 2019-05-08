import Axios from "axios";
import FormDataNode from "form-data";
import { Writable } from "readable-stream";
const POLYFILL_FORMDATA = typeof FormData === "undefined";
const PART_MIME = "application/octet-stream";
const DEFAULT_OPTIONS = Object.freeze({
    maxParallelUploads: 2,
    maxRetries: 0,
    partSize: 256,
    objectMode: false
});
export default class UploadStream extends Writable {
    constructor(account, hash, size, endpoint, options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options);
        super(opts);
        // Input
        this.account = account;
        this.hash = hash;
        this.endpoint = endpoint;
        this.options = opts;
        this.size = size;
        this.endIndex = Math.ceil(size / opts.partSize);
        console.log(`Uploading new file with ${this.endIndex} parts.`);
        // Internal
        this.bytesUploaded = 0;
        this.blockBuffer = [];
        this.partBuffer = [];
        this.bufferSize = 0;
        this.ongoingUploads = 0;
        this.retries = 0;
        this.partIndex = 0;
        this.finalCallback = null;
    }
    _write(data, encoding, callback) {
        this.blockBuffer.push(data);
        this.bufferSize += data.length;
        if (this.bufferSize >= this.options.partSize) {
            this._addPart();
            this._attemptUpload();
        }
        callback();
    }
    _final(callback) {
        this.finalCallback = callback;
        if (this.blockBuffer.length > 0) {
            this._addPart();
            this._attemptUpload();
        }
        else if (this.ongoingUploads === 0) {
            callback();
        }
    }
    // Flatten inputs into a single ArrayBuffer for sending
    _addPart() {
        const blocks = this.blockBuffer;
        const data = new Uint8Array(this.bufferSize);
        let offset = 0;
        do {
            const block = blocks.shift();
            data.set(block, offset);
            offset += block.length;
        } while (blocks.length > 0);
        this.partBuffer.push({
            partIndex: ++this.partIndex,
            data
        });
        this.blockBuffer = [];
        this.bufferSize = 0;
    }
    _attemptUpload() {
        if (this.ongoingUploads >= this.options.maxParallelUploads) {
            return;
        }
        const part = this.partBuffer.shift();
        this._upload(part);
    }
    _upload(part) {
        this.ongoingUploads++;
        // Cork stream when busy
        if (this.ongoingUploads === this.options.maxParallelUploads) {
            this.cork();
        }
        const data = new FormDataNode();
        const filename = `${this.hash}.${part.partIndex}.part`;
        const raw = POLYFILL_FORMDATA
            ? Buffer.from(part.data.buffer)
            : new Blob([part.data], { type: "application/octet-stream" });
        const length = raw.size ? raw.size : raw.length;
        // TODO: Actual account / signature
        data.append("hash", this.hash);
        data.append("account", this.account);
        data.append("partIndex", part.partIndex);
        data.append("endIndex", this.endIndex);
        data.append("part", raw, {
            filename: filename,
            contentType: "application/octet-stream",
            knownLength: part.data.length
        });
        const upload = Axios.put(this.endpoint + "/upload/file", data, {
            headers: data.getHeaders ? data.getHeaders() : {},
            onUploadProgress: (event) => {
                return;
            }
        })
            .then(result => {
            this._afterUpload(part);
        })
            .catch(error => {
            this._uploadError(error, part);
        });
    }
    _afterUpload(part) {
        this.ongoingUploads--;
        this.bytesUploaded += part.data.length;
        // TODO: Progress
        this.emit("progress", this.bytesUploaded / this.size);
        // Upload until done
        if (this.partBuffer.length > 0) {
            return this._attemptUpload();
        }
        if (this.finalCallback) {
            // Finish
            if (this.ongoingUploads === 0) {
                this.finalCallback();
            }
        }
        else {
            // Continue
            process.nextTick(() => this.uncork());
        }
    }
    _uploadError(error, part) {
        this.ongoingUploads--;
        console.warn("error", error);
        if (this.retries++ < this.options.maxRetries) {
            console.log("retrying", this.retries, "of", this.options.maxRetries);
            this.partBuffer.push(part);
            this._attemptUpload();
            return;
        }
        if (this.finalCallback) {
            this.finalCallback(error);
        }
        else {
            this.emit("error", error);
            this.end();
        }
    }
}
