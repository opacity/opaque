import Axios from "axios";
import { Writable } from "readable-stream";
import { getPayload, getPayloadFD } from "../core/request";
import { getEndIndex } from "../core/helpers";
const POLYFILL_FORMDATA = typeof FormData === "undefined";
const PART_MIME = "application/octet-stream";
const DEFAULT_OPTIONS = Object.freeze({
    maxParallelUploads: 3,
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
        this.endIndex = getEndIndex(size, opts);
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
        const data = getPayloadFD({
            fileHandle: this.hash,
            partIndex: part.partIndex,
            endIndex: this.endIndex
        }, {
            chunkData: part.data
        }, this.account);
        const upload = Axios.post(this.endpoint + "/api/v1/upload", data, {
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
        this.emit("progress", this.bytesUploaded / this.size);
        // Upload until done
        if (this.partBuffer.length > 0) {
            return this._attemptUpload();
        }
        if (this.finalCallback) {
            // Finish
            if (this.ongoingUploads === 0) {
                this._finishUpload();
            }
        }
        else {
            // Continue
            process.nextTick(() => this.uncork());
        }
    }
    async _finishUpload() {
        const data = getPayload({
            fileHandle: this.hash
        }, this.account);
        await new Promise(resolve => {
            const interval = setInterval(async () => {
                const req = Axios.post(this.endpoint + "/api/v1/upload-status", data);
                const res = await req;
                if (!res.data.missingIndexes || !res.data.missingIndexes.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, 5000);
        });
        this.finalCallback();
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
