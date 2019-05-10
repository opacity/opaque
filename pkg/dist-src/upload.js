import Axios from "axios";
import { EventEmitter } from "events";
import { createMetadata, encryptMetadata } from "./core/metadata";
import { generateFileKeys, getUploadSize, getFileData } from "./core/helpers";
// import { UPLOAD_EVENTS as EVENTS } from "./core/constants";
import FormDataNode from "form-data";
import EncryptStream from "./streams/encryptStream";
import UploadStream from "./streams/uploadStream";
const PART_MIN_SIZE = 1024 * 1024 * 5;
const POLYFILL_FORMDATA = typeof FormData === "undefined";
const DEFAULT_OPTIONS = Object.freeze({
    autoStart: true
});
const DEFAULT_FILE_PARAMS = {
    blockSize: 64 * 1024,
};
export default class Upload extends EventEmitter {
    constructor(file, account, opts) {
        super();
        this.startUpload = async () => {
            try {
                await this.uploadMetadata();
                await this.uploadFile();
            }
            catch (e) {
                this.propagateError(e);
            }
        };
        this.uploadMetadata = async () => {
            const meta = createMetadata(this.data, this.options.params);
            const encryptedMeta = encryptMetadata(meta, this.key);
            const data = new FormDataNode();
            const raw = POLYFILL_FORMDATA
                ? Buffer.from(encryptedMeta.buffer)
                : new Blob([encryptedMeta], { type: "application/octet-stream" });
            const length = raw.size ? raw.size : raw.length;
            // TODO: Actual account
            data.append("account", this.account);
            // TODO: Use separate metadata hash
            data.append("hash", this.hash);
            // Just used to prematurely return an error if not enough space
            data.append("size", this.uploadSize);
            data.append("metadata", raw, {
                filename: 'metadata',
                contentType: "application/octet-stream",
                knownLength: length
            });
            return Axios.put(this.options.endpoint + "/upload/metadata", data, {
                headers: data.getHeaders ? data.getHeaders() : {}
            })
                .then(res => {
                this.emit("metadata", meta);
            })
                .catch(error => {
                this.propagateError(error);
            });
        };
        this.uploadFile = async () => {
            const readStream = new this.data.reader(this.data, this.options.params);
            this.readStream = readStream;
            this.encryptStream = new EncryptStream(this.key, this.options.params);
            this.uploadStream = new UploadStream(this.account, this.hash, this.uploadSize, this.options.endpoint, this.options.params);
            this.uploadStream.on("progress", progress => {
                this.emit("upload-progress", {
                    target: this,
                    handle: this.handle,
                    progress
                });
            });
            this.readStream
                .pipe(this.encryptStream)
                .pipe(this.uploadStream)
                .on("finish", this.finishUpload);
            this.readStream.on("error", this.propagateError);
            this.encryptStream.on("error", this.propagateError);
            this.uploadStream.on("error", this.propagateError);
        };
        this.propagateError = (error) => {
            process.nextTick(() => this.emit("error", error));
        };
        const options = Object.assign({}, DEFAULT_OPTIONS, opts || {});
        options.params = Object.assign({}, DEFAULT_FILE_PARAMS, options.params || {});
        const { handle, hash, key } = generateFileKeys();
        const data = getFileData(file, handle);
        const size = getUploadSize(file.size, options.params);
        this.startUpload = this.startUpload.bind(this);
        this.uploadMetadata = this.uploadMetadata.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.finishUpload = this.finishUpload.bind(this);
        this.account = account;
        this.options = options;
        this.data = data;
        this.uploadSize = size;
        this.key = key; // Encryption key
        this.hash = hash; // Datamap entry hash
        this.handle = handle; // File handle - hex(hash) + hex(key)
        this.metadata = createMetadata(data, options.params);
        if (options.autoStart) {
            this.startUpload();
        }
    }
    async finishUpload() {
        this.emit("finish", {
            target: this,
            handle: this.handle,
            metadata: this.metadata
        });
    }
}
