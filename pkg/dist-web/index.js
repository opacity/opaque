import Axios from 'axios';
import { EventEmitter } from 'events';
import { md, random, util, cipher } from 'node-forge';
import isBuffer from 'is-buffer';
import { Readable, Transform, Writable } from 'readable-stream';
import mime from 'mime/lite';
import FormDataNode from 'form-data';
import { keccak256 } from 'ethereumjs-util';
import { soliditySha3 } from 'web3-utils';
import { posix } from 'path-browserify';
import debounce from 'debounce';
import { validateMnemonic, generateMnemonic, mnemonicToSeedSync } from 'bip39';
import HDKey, { fromMasterSeed } from 'hdkey';
export { default as HDKey } from 'hdkey';
import { hash as hash$1 } from 'eth-ens-namehash';

const DEFAULT_OPTIONS = Object.freeze({
    objectMode: false
});
class FileSourceStream extends Readable {
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

const DEFAULT_OPTIONS$1 = Object.freeze({
    objectMode: false
});
class BufferSourceStream extends Readable {
    constructor(data, options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS$1, options);
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

const FILENAME_MAX_LENGTH = 256;
const IV_BYTE_LENGTH = 16;
const TAG_BYTE_LENGTH = 16;
const TAG_BIT_LENGTH = TAG_BYTE_LENGTH * 8;
const DEFAULT_BLOCK_SIZE = 64 * 1024;
const BLOCK_OVERHEAD = TAG_BYTE_LENGTH + IV_BYTE_LENGTH;
const DEFAULT_PART_SIZE = 128 * (DEFAULT_BLOCK_SIZE + BLOCK_OVERHEAD);

const Forge = { md: md, random: random, util: util };
const ByteBuffer = Forge.util.ByteBuffer;
// Generate new handle, datamap entry hash and encryption key
// TODO: Decide on format and derivation
function generateFileKeys() {
    const hash = Forge.md.sha256
        .create()
        .update(Forge.random.getBytesSync(32))
        .digest().toHex();
    const key = Forge.md.sha256
        .create()
        .update(Forge.random.getBytesSync(32))
        .digest().toHex();
    const handle = hash + key;
    return {
        hash,
        key,
        handle
    };
}
// Return datamap hash and encryption key from handle
// TODO: Decide on format and derivation
function keysFromHandle(handle) {
    const bytes = Forge.util.binary.hex.decode(handle);
    const buf = new ByteBuffer(bytes);
    const hash = buf.getBytes(32);
    const key = buf.getBytes(32);
    return {
        hash: Forge.util.bytesToHex(hash),
        key: Forge.util.bytesToHex(key),
        handle
    };
}
function sanitizeFilename(filename) {
    if (filename.length > FILENAME_MAX_LENGTH) {
        const l = (FILENAME_MAX_LENGTH / 2) - 2;
        const start = filename.substring(0, l);
        const end = filename.substring(filename.length - l);
        filename = start + "..." + end;
    }
    return filename;
}
// Rudimentary format normalization
function getFileData(file, nameFallback = "file") {
    if (isBuffer(file)) {
        file = file;
        return {
            data: file,
            size: file.length,
            name: nameFallback,
            type: "application/octet-stream",
            reader: BufferSourceStream
        };
    }
    else if (file && file.data && isBuffer(file.data)) {
        file = file;
        return {
            data: file.data,
            size: file.data.length,
            name: file.name || nameFallback,
            type: file.type || mime.getType(file.name) || "",
            reader: BufferSourceStream
        };
    }
    else {
        // TODO
        file.reader = FileSourceStream;
    }
    return file;
}
function getMimeType(metadata) {
    return metadata.type || mime.getType(metadata.name) || "";
}
// get true upload size, accounting for encryption overhead
function getUploadSize(size, params) {
    const blockSize = params.blockSize || DEFAULT_BLOCK_SIZE;
    const blockCount = Math.ceil(size / blockSize);
    return size + blockCount * BLOCK_OVERHEAD;
}
// get
function getEndIndex(uploadSize, params) {
    const blockSize = params.blockSize || DEFAULT_BLOCK_SIZE;
    const partSize = params.partSize || DEFAULT_PART_SIZE;
    const chunkSize = blockSize + BLOCK_OVERHEAD;
    const chunkCount = Math.ceil(uploadSize / chunkSize);
    const chunksPerPart = Math.ceil(partSize / chunkSize);
    const endIndex = Math.ceil(chunkCount / chunksPerPart);
    return endIndex;
}
function getBlockSize(params) {
    if (params && params.blockSize) {
        return params.blockSize;
    }
    else if (params && params.p && params.p.blockSize) {
        return params.p.blockSize;
    }
    else {
        return DEFAULT_BLOCK_SIZE;
    }
}

const Forge$1 = { cipher: cipher, md: md, util: util, random: random };
const ByteBuffer$1 = Forge$1.util.ByteBuffer;
// Encryption
function encrypt(key, byteBuffer) {
    const keyBuf = new ByteBuffer$1(Buffer.from(key, "hex"));
    const iv = Forge$1.random.getBytesSync(IV_BYTE_LENGTH);
    const cipher = Forge$1.cipher.createCipher("AES-GCM", keyBuf);
    cipher.start({
        iv,
        tagLength: TAG_BIT_LENGTH
    });
    cipher.update(byteBuffer);
    cipher.finish();
    byteBuffer.clear();
    byteBuffer.putBuffer(cipher.output);
    byteBuffer.putBuffer(cipher.mode.tag);
    byteBuffer.putBytes(iv);
    return byteBuffer;
}
function encryptString(key, string, encoding = "utf8") {
    const buf = Forge$1.util.createBuffer(string, encoding);
    return encrypt(key, buf);
}
function encryptBytes(key, bytes) {
    return encrypt(key, Forge$1.util.createBuffer(bytes));
}
// Decryption
function decrypt(key, byteBuffer) {
    const keyBuf = new ByteBuffer$1(Buffer.from(key, "hex"));
    keyBuf.read = 0;
    byteBuffer.read = byteBuffer.length() - BLOCK_OVERHEAD;
    const tag = byteBuffer.getBytes(TAG_BYTE_LENGTH);
    const iv = byteBuffer.getBytes(IV_BYTE_LENGTH);
    const decipher = Forge$1.cipher.createDecipher("AES-GCM", keyBuf);
    byteBuffer.read = 0;
    byteBuffer.truncate(BLOCK_OVERHEAD);
    decipher.start({
        iv,
        // the type definitions are wrong in @types/node-forge
        tag: tag,
        tagLength: TAG_BIT_LENGTH
    });
    decipher.update(byteBuffer);
    if (decipher.finish()) {
        return decipher.output;
    }
    else {
        return false;
    }
}
function decryptBytes(key, bytes) {
    const buf = new ByteBuffer$1(bytes);
    const output = decrypt(key, buf);
    if (output) {
        return Forge$1.util.binary.raw.decode(output.getBytes());
    }
    else {
        return false;
    }
}
function decryptString(key, byteBuffer, encoding = "utf8") {
    const output = decrypt(key, byteBuffer);
    if (output) {
        return Buffer.from(output.toString()).toString(encoding);
    }
    else {
        throw new Error("unable to decrypt");
    }
}

const Forge$2 = { util: util };
function createMetadata(file, opts) {
    const filename = sanitizeFilename(file.name);
    const metadata = {
        name: filename,
        type: file.type,
        size: file.size,
        p: opts
    };
    return metadata;
}
function encryptMetadata(metadata, key) {
    const encryptedMeta = encryptString(key, JSON.stringify(metadata), "utf8");
    return Forge$2.util.binary.raw.decode(encryptedMeta.getBytes());
}
function decryptMetadata(data, key) {
    const byteStr = Forge$2.util.binary.raw.encode(data);
    const byteBuffer = new Forge$2.util.ByteBuffer(byteStr);
    const meta = JSON.parse(decryptString(key, byteBuffer));
    return meta;
}

const DEFAULT_OPTIONS$2 = Object.freeze({
    binaryMode: false,
    objectMode: true,
    blockSize: DEFAULT_BLOCK_SIZE
});
class DecryptStream extends Transform {
    constructor(key, options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS$2, options);
        super(opts);
        this.options = opts;
        this.key = key;
        this.iter = 0;
        this.blockSize = getBlockSize(options);
    }
    _transform(chunk, encoding, callback) {
        const blockSize = this.blockSize;
        const chunkSize = blockSize + BLOCK_OVERHEAD;
        const length = chunk.length;
        for (let offset = 0; offset < length; offset += chunkSize) {
            const limit = Math.min(offset + chunkSize, length);
            const buf = chunk.slice(offset, limit);
            const data = decryptBytes(this.key, buf);
            if (data) {
                this.push(data);
            }
            else {
                this.emit("error", "Error decrypting data block");
            }
        }
        callback(null);
    }
}

const DEFAULT_OPTIONS$3 = Object.freeze({
    autostart: true,
    maxParallelDownloads: 1,
    maxRetries: 0,
    partSize: 80 * (DEFAULT_BLOCK_SIZE + BLOCK_OVERHEAD),
    objectMode: false
});
class DownloadStream extends Readable {
    constructor(url, metadata, size, options = {}) {
        const opts = Object.assign({}, DEFAULT_OPTIONS$3, options);
        super(opts);
        // Input
        this.options = opts;
        this.url = url;
        this.size = size;
        this.metadata = metadata;
        // Internal
        this.chunks = [];
        this.chunkId = 0;
        this.pushId = 0;
        this.bytesDownloaded = 0;
        this.isDownloadFinished = false;
        this.ongoingDownloads = 0;
        this.pushChunk = false;
        const blockSize = getBlockSize(metadata);
        const blockCount = opts.partSize / (blockSize + BLOCK_OVERHEAD);
        if (blockCount !== Math.floor(blockCount)) {
            this.emit("error", "options.partSize must be a multiple of blockSize + blockOverhead");
        }
        if (opts.autostart) {
            this._download();
        }
    }
    _read() {
        this.pushChunk = true;
        const attemptDownload = this.ongoingDownloads < this.options.maxParallelDownloads;
        if (!this.isDownloadFinished && attemptDownload) {
            this._download();
        }
        this._pushChunk();
    }
    async _download(chunkIndex) {
        const size = this.size;
        const partSize = this.options.partSize;
        const index = chunkIndex || this.chunks.length;
        const offset = index * partSize;
        // TODO: Make sure last byte works to prevent edge case
        if (offset >= size) {
            this.isDownloadFinished = true;
            return;
        }
        const limit = Math.min(offset + partSize, size) - offset;
        const range = `bytes=${offset}-${offset + limit - 1}`;
        const chunk = {
            id: this.chunkId++,
            data: null,
            offset,
            limit
        };
        try {
            this.chunks.push(chunk);
            this.ongoingDownloads++;
            const download = await Axios.get(this.url + "/file", {
                responseType: "arraybuffer",
                headers: {
                    range
                }
            });
            chunk.data = new Uint8Array(download.data);
            this.bytesDownloaded += chunk.data.length;
            this.ongoingDownloads--;
            this.emit("progress", this.bytesDownloaded / this.size);
            this._pushChunk();
        }
        catch (error) {
            this.ongoingDownloads--;
            this.emit("error", error);
        }
        return;
    }
    async _afterDownload() {
    }
    _pushChunk() {
        if (!this.pushChunk) {
            return;
        }
        const chunk = this.chunks[this.pushId];
        if (chunk && chunk.data !== null) {
            this.pushId++;
            this.pushChunk = this.push(chunk.data);
            chunk.data = null;
            this._pushChunk();
        }
        else if (this.ongoingDownloads === 0 && this.isDownloadFinished) {
            this.push(null);
        }
    }
}

const METADATA_PATH = "/download/metadata/";
const DEFAULT_OPTIONS$4 = Object.freeze({
    autoStart: true
});
/**
 * @internal
 */
class Download extends EventEmitter {
    constructor(handle, opts = {}) {
        super();
        this.metadata = async () => {
            if (this._metadata) {
                return this._metadata;
            }
            else {
                return await this.downloadMetadata();
            }
        };
        this.toBuffer = async () => {
            const chunks = [];
            let totalLength = 0;
            if (typeof Buffer === "undefined") {
                return false;
            }
            await this.startDownload();
            return new Promise(resolve => {
                this.decryptStream.on("data", (data) => {
                    chunks.push(data);
                    totalLength += data.length;
                });
                this.decryptStream.once("finish", () => {
                    resolve(Buffer.concat(chunks, totalLength));
                });
            }).catch(err => {
                throw err;
            });
        };
        this.toFile = async () => {
            const chunks = [];
            let totalLength = 0;
            await this.startDownload();
            return new Promise(resolve => {
                this.decryptStream.on("data", (data) => {
                    chunks.push(data);
                    totalLength += data.length;
                });
                this.decryptStream.once("finish", async () => {
                    const meta = await this.metadata();
                    resolve(new File(chunks, meta.name, {
                        type: getMimeType(meta)
                    }));
                });
            }).catch(err => {
                throw err;
            });
        };
        this.startDownload = async () => {
            try {
                await this.getDownloadURL();
                await this.downloadMetadata();
                await this.downloadFile();
            }
            catch (e) {
                this.propagateError(e);
            }
        };
        this.getDownloadURL = async (overwrite = false) => {
            let req;
            if (!overwrite && this.downloadURLRequest) {
                req = this.downloadURLRequest;
            }
            else {
                req = Axios.post(this.options.endpoint + "/api/v1/download", {
                    fileID: this.hash
                });
                this.downloadURLRequest = req;
            }
            const res = await req;
            if (res.status === 200) {
                this.downloadURL = res.data.fileDownloadUrl;
                return this.downloadURL;
            }
        };
        this.downloadMetadata = async (overwrite = false) => {
            let req;
            if (!this.downloadURL) {
                await this.getDownloadURL();
            }
            if (!overwrite && this.metadataRequest) {
                req = this.metadataRequest;
            }
            else {
                const endpoint = this.options.endpoint;
                const path = METADATA_PATH + this.hash;
                req = Axios.get(this.downloadURL + "/metadata", {
                    responseType: "arraybuffer"
                });
                this.metadataRequest = req;
            }
            const res = await req;
            const metadata = decryptMetadata(new Uint8Array(res.data), this.key);
            this._metadata = metadata;
            this.size = getUploadSize(metadata.size, metadata.p || {});
            return metadata;
        };
        this.downloadFile = async () => {
            if (this.isDownloading) {
                return true;
            }
            this.isDownloading = true;
            this.downloadStream = new DownloadStream(this.downloadURL, await this.metadata, this.size, this.options);
            this.decryptStream = new DecryptStream(this.key);
            this.downloadStream.on("progress", progress => {
                this.emit("download-progress", {
                    target: this,
                    handle: this.handle,
                    progress: progress
                });
            });
            this.downloadStream
                .pipe(this.decryptStream);
            this.downloadStream.on("error", this.propagateError);
            this.decryptStream.on("error", this.propagateError);
        };
        this.finishDownload = (error) => {
            if (error) {
                this.propagateError(error);
            }
            else {
                this.emit("finish");
            }
        };
        this.propagateError = (error) => {
            console.warn("Download error: ", error.message || error);
            process.nextTick(() => this.emit("error", error.message || error));
        };
        const options = Object.assign({}, DEFAULT_OPTIONS$4, opts);
        const { hash, key } = keysFromHandle(handle);
        this.options = options;
        this.handle = handle;
        this.hash = hash;
        this.key = key;
        this.downloadURLRequest = null;
        this.metadataRequest = null;
        this.isDownloading = false;
        if (options.autoStart) {
            this.startDownload();
        }
    }
}

const Forge$3 = { util: util };
const DEFAULT_OPTIONS$5 = Object.freeze({
    objectMode: false
});
class EncryptStream extends Transform {
    constructor(key, options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS$5, options);
        super(opts);
        this.options = opts;
        this.key = key;
    }
    _transform(data, encoding, callback) {
        const chunk = encryptBytes(this.key, data);
        const buf = Forge$3.util.binary.raw.decode(chunk.getBytes());
        this.push(buf);
        callback(null);
    }
}

/**
 * get a list of available plans
 *
 * @param endpoint
 *
 * @internal
 */
async function getPlans(endpoint) {
    return Axios.get(endpoint + "/plans");
}

/**
 * check whether a payment has gone through for an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to check
 *
 * @internal
 */
async function checkPaymentStatus(endpoint, hdNode) {
    const payload = {
        timestamp: Math.floor(Date.now() / 1000)
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/account-data", signedPayload);
}

/**
 * request the creation of an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKey
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
async function createAccount(endpoint, hdNode, metadataKey, duration = 12, limit = 128) {
    const payload = {
        metadataKey: metadataKey,
        durationInMonths: duration,
        storageLimit: limit
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/accounts", signedPayload);
}

/**
 * request creating a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
async function createMetadata$1(endpoint, hdNode, metadataKey) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/create", signedPayload);
}
/**
 * request deleting a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
async function deleteMetadata(endpoint, hdNode, metadataKey) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/delete", signedPayload);
}
/**
 * request changing a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 * @param metadata - the metadata to put
 *
 * @internal
 */
async function setMetadata(endpoint, hdNode, metadataKey, metadata) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadata, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/set", signedPayload);
}
/**
 * request get of a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
async function getMetadata(endpoint, hdNode, metadataKey) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = { timestamp, metadataKey };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/get", signedPayload);
}

const POLYFILL_FORMDATA = typeof FormData === "undefined";
/**
 * get a signed payload from an hdkey
 *
 * @param rawPayload - a payload object to be processed and signed
 * @param hdNode = the account to sign with
 * @param key
 *
 * @internal
 */
function getPayload(rawPayload, hdNode, key = "requestBody") {
    const payload = JSON.stringify(rawPayload);
    const hash = keccak256(payload);
    const signature = hdNode.sign(hash).toString("hex");
    const pubKey = hdNode.publicKey.toString("hex");
    const signedPayload = {
        signature,
        publicKey: pubKey,
        hash: hash.toString("hex")
    };
    signedPayload[key] = payload;
    return signedPayload;
}
/**
 * get a signed formdata payload from an hdkey
 *
 * @param rawPayload - a payload object to be processed and signed
 * @param extraPayload - additional (unsigned) payload information
 * @param hdNode - the account to sign with
 * @param key
 *
 * @internal
 */
function getPayloadFD(rawPayload, extraPayload, hdNode, key = "requestBody") {
    // rawPayload.timestamp = Date.now();
    const payload = JSON.stringify(rawPayload);
    const hash = keccak256(payload);
    const signature = hdNode.sign(hash).toString("hex");
    const pubKey = hdNode.publicKey.toString("hex");
    // node, buffers
    if (POLYFILL_FORMDATA) {
        const data = new FormDataNode();
        data.append(key, payload);
        data.append("signature", signature);
        data.append("publicKey", pubKey);
        // data.append("hash", hash);
        if (extraPayload) {
            Object.keys(extraPayload).forEach(key => {
                const pl = Buffer.from(extraPayload[key]);
                data.append(key, pl, {
                    filename: key,
                    contentType: "application/octet-stream",
                    knownLength: pl.length
                });
            });
        }
        return data;
    }
    else {
        const data = new FormData();
        data.append(key, payload);
        data.append("signature", signature);
        data.append("publicKey", pubKey);
        if (extraPayload) {
            Object.keys(extraPayload).forEach(key => {
                data.append(key, new Blob([extraPayload[key].buffer]), key);
            });
        }
        return data;
    }
}

const DEFAULT_OPTIONS$6 = Object.freeze({
    maxParallelUploads: 3,
    maxRetries: 0,
    partSize: DEFAULT_PART_SIZE,
    objectMode: false
});
class UploadStream extends Writable {
    constructor(account, hash, size, endpoint, options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS$6, options);
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
            this._finishUpload();
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
        const confirmUpload = this._confirmUpload.bind(this);
        const data = getPayload({
            fileHandle: this.hash
        }, this.account);
        let uploadFinished = false;
        do {
            uploadFinished = await confirmUpload(data);
            if (!uploadFinished) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } while (!uploadFinished);
        this.finalCallback();
    }
    async _confirmUpload(data) {
        try {
            const req = Axios.post(this.endpoint + "/api/v1/upload-status", data);
            const res = await req;
            if (!res.data.missingIndexes || !res.data.missingIndexes.length) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (err) {
            console.warn(err.message || err);
            return false;
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

const DEFAULT_OPTIONS$7 = Object.freeze({
    autoStart: true
});
const DEFAULT_FILE_PARAMS = {
    blockSize: 64 * 1024,
};
/**
 * @internal
 */
class Upload extends EventEmitter {
    constructor(file, account, opts = {}) {
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
            const data = getPayloadFD({
                fileHandle: this.hash,
                fileSizeInByte: this.uploadSize,
                endIndex: getEndIndex(this.uploadSize, this.options.params)
            }, {
                metadata: encryptedMeta
            }, this.account);
            const url = this.options.endpoint + "/api/v1/init-upload";
            const headers = data.getHeaders ? data.getHeaders() : {};
            const req = Axios.post(url, data, { headers });
            const res = await req;
            this.emit("metadata", meta);
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
        this.finishUpload = async () => {
            this.emit("finish", {
                target: this,
                handle: this.handle,
                metadata: this.metadata
            });
        };
        this.propagateError = (error) => {
            process.nextTick(() => this.emit("error", error));
        };
        const options = Object.assign({}, DEFAULT_OPTIONS$7, opts);
        options.params = Object.assign({}, DEFAULT_FILE_PARAMS, options.params || {});
        const { handle, hash, key } = generateFileKeys();
        const data = getFileData(file, handle);
        const size = getUploadSize(data.size, options.params);
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
}

const downloadFile = (masterHandle, handle) => {
    return new Download(handle, masterHandle.downloadOpts);
};

const hash = (...val) => {
    return soliditySha3(...val).replace(/^0x/, "");
};

const hashToPath = (h, { prefix = false } = {}) => {
    if (h.length % 4) {
        throw new Error("hash length must be multiple of two bytes");
    }
    return (prefix ? "m/" : "") + h.match(/.{1,4}/g).map(p => parseInt(p, 16)).join("'/") + "'";
};

const generateSubHDKey = (masterHandle, pathString) => {
    const path = hashToPath(hash(pathString), { prefix: true });
    return masterHandle.derive(path);
};

const getAccountInfo = async (masterHandle) => ((await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data.account);

// TODO: don't use polyfill
const posixSep = new RegExp(posix.sep + "+", "g");
const posixSepEnd = new RegExp("(.)" + posix.sep + "+$");
// NOTE: win32 isn't included in the polyfill
const win32Sep = new RegExp("\\+", "g");
const trimTrailingSep = (path) => {
    return path.replace(posixSepEnd, "$1");
};
const cleanPath = (path) => {
    return trimTrailingSep(path.replace(win32Sep, posix.sep).replace(posixSep, posix.sep));
};

const getFolderHDKey = (masterHandle, dir) => {
    dir = cleanPath(dir);
    return generateSubHDKey(masterHandle, "folder: " + dir);
};

const getFolderLocation = (masterHandle, dir) => {
    dir = cleanPath(dir);
    return hash(masterHandle.getFolderHDKey(dir).publicKey.toString("hex"));
};

const getFolderMeta = async (masterHandle, dir) => {
    dir = cleanPath(dir);
    const folderKey = masterHandle.getFolderHDKey(dir), location = masterHandle.getFolderLocation(dir), key = hash(folderKey.privateKey.toString("hex")), 
    // TODO: verify folder can only be read by the creating account
    response = await getMetadata(masterHandle.uploadOpts.endpoint, masterHandle, 
    // folderKey,
    location);
    try {
        // TODO
        // I have no idea why but the decrypted is correct hex without converting
        const metaString = decrypt(key, new util.ByteBuffer(Buffer.from(response.data.metadata, "hex"))).toString();
        try {
            const meta = JSON.parse(metaString);
            return meta;
        }
        catch (err) {
            console.error(err);
            console.info("META STRING:", metaString);
            throw new Error("metadata corrupted");
        }
    }
    catch (err) {
        console.error(err);
        throw new Error("error decrypting meta");
    }
};

const getHandle = (masterHandle) => {
    return masterHandle.privateKey.toString("hex") + masterHandle.chainCode.toString("hex");
};

const isPaid = async (masterHandle) => {
    try {
        const accountInfoResponse = await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle);
        return accountInfoResponse.data.paymentStatus == "paid";
    }
    catch {
        return false;
    }
};

const register = async (masterHandle, duration, limit) => {
    if (await masterHandle.isPaid()) {
        return {
            data: { invoice: { cost: 0, ethAddress: "0x0" } },
            waitForPayment: async () => ({ data: (await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data })
        };
    }
    const createAccountResponse = await createAccount(masterHandle.uploadOpts.endpoint, masterHandle, masterHandle.getFolderLocation("/"), duration, limit);
    return {
        data: createAccountResponse.data,
        waitForPayment: () => new Promise(resolve => {
            const interval = setInterval(async () => {
                // don't perform run if it takes more than 5 seconds for response
                const time = Date.now();
                if (await masterHandle.isPaid() && time + 5 * 1000 > Date.now()) {
                    clearInterval(interval);
                    await masterHandle.login();
                    resolve({ data: (await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data });
                }
            }, 10 * 1000);
        })
    };
};

/**
 * internal API v0
 *
 * @internal
 */
const v0 = {
    downloadFile,
    generateSubHDKey,
    getAccountInfo,
    getFolderHDKey,
    getFolderLocation,
    getFolderMeta,
    getHandle,
    isPaid,
    register
};

/**
 * metadata to describe a version of a file as it relates to a filesystem
 *
 * @public
 */
class FileVersion {
    /**
     * create metadata for a file version
     *
     * @param handle - the file handle
     * @param size - the size of the file in bytes
     * @param created - the date this version was uploaded
     * @param modified - the date the filesystem marked as last modified
     */
    constructor({ handle, size, created = Date.now(), modified = Date.now() }) {
        /** @internal */
        this.minify = () => new MinifiedFileVersion([
            this.handle,
            this.size,
            this.created,
            this.modified
        ]);
        this.handle = handle;
        this.size = size;
        this.created = created;
        this.modified = modified;
    }
}
/**
 * @internal
 */
class MinifiedFileVersion extends Array {
    constructor([handle, size, created, modified]) {
        super(4);
        this.unminify = () => new FileVersion({
            handle: this[0],
            size: this[1],
            created: this[2],
            modified: this[3]
        });
        this[0] = handle;
        this[1] = size;
        this[2] = created;
        this[3] = modified;
    }
}

/**
 * metadata to describe a file as it relates to the UI
 *
 * @public
 */
class FileEntryMeta {
    /**
     * create metadata for a file entry in the UI
     *
     * @param name - the name of the file as shown in the UI
     * @param created - the date in `ms` that this file was initially uploaded
     * @param created - the date in `ms` that the newest version of this file was uploaded
     * @param versions - versions of the uploaded file (the most recent of which should be the current version of the file)
     */
    constructor({ name, created = Date.now(), modified = Date.now(), versions = [] }) {
        /** @internal */
        this.minify = () => new MinifiedFileEntryMeta([
            this.name,
            this.created,
            this.modified,
            this.versions.map(version => new FileVersion(version).minify())
        ]);
        this.name = name;
        this.created = created;
        this.modified = modified;
        this.versions = versions;
    }
}
/**
 * @internal
 */
class MinifiedFileEntryMeta extends Array {
    constructor([name, created, modified, versions]) {
        super(4);
        this.unminify = () => new FileEntryMeta({
            name: this[0],
            created: this[1],
            modified: this[2],
            versions: this[3].map(version => new MinifiedFileVersion(version).unminify())
        });
        this[0] = name;
        this[1] = created;
        this[2] = modified;
        this[3] = versions;
    }
}

/**
 * metadata to describe where a folder can be found (for root metadata of an account)
 *
 * @public
 */
class FolderEntryMeta {
    /**
     * create metadata entry for a folder
     *
     * @param name - a name of the folder shown in the UI
     * @param location - the public key for the metadata file
     *   it is how the file will be queried for (using the same system as for the account metadata)
     */
    constructor({ name, location }) {
        /** @internal */
        this.minify = () => new MinifiedFolderEntryMeta([
            this.name,
            this.location
        ]);
        this.name = name;
        this.location = location;
    }
}
/**
 * @internal
 */
class MinifiedFolderEntryMeta extends Array {
    constructor([name, location]) {
        super(2);
        this.unminify = () => new FolderEntryMeta({
            name: this[0],
            location: this[1]
        });
        this[0] = name;
        this[1] = location;
    }
}

/**
 * metadata to describe a folder for the UI
 *
 * @public
 */
class FolderMeta {
    /**
     * create metadata for a folder
     *
     * @param name - a nickname shown on the folder when accessed without adding to account metadata
     * @param files - the files included only in the most shallow part of the folder
     * @param created - when the folder was created (if not created now) in `ms`
     * @param created - when the folder was changed (if not modified now) in `ms`
     */
    constructor({ name = "Folder", files = [], folders = [], created = Date.now(), modified = Date.now() } = {}) {
        /** @internal */
        this.minify = () => new MinifiedFolderMeta([
            this.name,
            this.files.map(file => new FileEntryMeta(file).minify()),
            this.folders.map(folder => new FolderEntryMeta(folder).minify()),
            this.created,
            this.modified
        ]);
        this.name = name;
        this.files = files;
        this.folders = folders;
        this.created = created;
        this.modified = modified;
    }
}
/**
 * @internal
 */
class MinifiedFolderMeta extends Array {
    constructor([name, files, folders, created, modified]) {
        super(5);
        this.unminify = () => new FolderMeta({
            name: this[0],
            files: this[1].map(file => new MinifiedFileEntryMeta(file).unminify()),
            folders: this[2].map(folder => new MinifiedFolderEntryMeta(folder).unminify()),
            created: this[3],
            modified: this[4]
        });
        this[0] = name;
        this[1] = files;
        this[2] = folders;
        this[3] = created;
        this[4] = modified;
    }
}

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

const setFolderMeta = async (masterHandle, dir, folderMeta) => {
    dir = cleanPath(dir);
    const folderKey = masterHandle.getFolderHDKey(dir), key = hash(folderKey.privateKey.toString("hex")), metaString = JSON.stringify(folderMeta.minify()), encryptedMeta = Buffer.from(encryptString(key, metaString, "utf8").toHex(), "hex").toString("base64");
    // TODO: verify folder can only be changed by the creating account
    await setMetadata(masterHandle.uploadOpts.endpoint, masterHandle, 
    // masterHandle.getFolderHDKey(dir),
    masterHandle.getFolderLocation(dir), encryptedMeta);
};

const removeFile = async (metaQueue, meta, file) => {
    // precondition for if file is no longer in the metadata
    if (!meta.files.find(f => file === f || file.name === f.name))
        return meta;
    meta.files = meta.files.filter(f => file !== f && file.name !== f.name);
    return meta;
};

const removeVersion = async (metaQueue, meta, version) => {
    const file = meta.files.find(f => f.versions.includes(version) || !!f.versions.find(v => version.handle === v.handle));
    // precondition for if version no longer exists in meta
    if (!file)
        return meta;
    file.versions = file.versions.filter(v => version !== v && version.handle !== v.handle);
    if (file.versions.length === 0)
        metaQueue.push({
            type: "remove-file",
            payload: file
        });
    return meta;
};

const addFile = (metaQueue, meta, file) => {
    const existingFile = meta.files.find(f => file === f || file.name === f.name);
    if (existingFile) {
        existingFile.modified = file.modified;
        existingFile.versions = [...existingFile.versions, ...file.versions];
    }
    else {
        meta.files.push(file);
    }
    return meta;
};

const addFolder = (metaQueue, meta, folder) => {
    const existingFolder = meta.folders.find(f => folder === f || folder.name === f.name);
    if (!existingFolder)
        meta.folders.push(folder);
    return meta;
};

const removeFolder = async (metaQueue, meta, folder) => {
    // precondition for if folder is no longer in the metadata
    if (!meta.folders.find(f => folder === f || folder.name === f.name))
        return meta;
    meta.folders = meta.folders.filter(f => folder !== f && folder.name !== f.name);
    return meta;
};

const createMetaQueue = (masterHandle, dir) => {
    dir = cleanPath(dir);
    if (masterHandle.metaQueue[dir])
        return;
    const metaQueue = new NetQueue({
        fetch: async () => {
            return getFolderMeta$1(masterHandle, dir);
        },
        update: async (meta) => {
            await setFolderMeta(masterHandle, dir, meta);
        }
    });
    const types = [
        { type: "add-folder", action: addFolder },
        { type: "add-file", action: addFile },
        { type: "remove-folder", action: removeFolder },
        { type: "remove-file", action: removeFile },
        { type: "remove-version", action: removeVersion }
    ];
    for (let type of types) {
        metaQueue.addType({
            type: type.type,
            handler: async (meta, payload) => {
                return await type.action(metaQueue, meta, payload);
            }
        });
    }
    masterHandle.metaQueue[dir] = metaQueue;
};

const getFolderMeta$1 = async (masterHandle, dir) => {
    dir = cleanPath(dir);
    createMetaQueue(masterHandle, dir);
    const folderKey = masterHandle.getFolderHDKey(dir), location = masterHandle.getFolderLocation(dir), key = hash(folderKey.privateKey.toString("hex")), 
    // TODO: verify folder can only be read by the creating account
    response = await getMetadata(masterHandle.uploadOpts.endpoint, masterHandle, 
    // folderKey,
    location);
    try {
        const metaString = decrypt(key, new util.ByteBuffer(Buffer.from(response.data.metadata, "base64"))).toString();
        try {
            const meta = JSON.parse(metaString);
            return new MinifiedFolderMeta(meta).unminify();
        }
        catch (err) {
            console.error(err);
            console.info("META STRING:", metaString);
            throw new Error("metadata corrupted");
        }
    }
    catch (err) {
        console.error(err);
        throw new Error("error decrypting meta");
    }
};

const buildFullTree = async (masterHandle, dir = "/") => {
    dir = cleanPath(dir);
    const tree = {};
    tree[dir] = await getFolderMeta$1(masterHandle, dir);
    await Promise.all(tree[dir].folders.map(async (folder) => {
        Object.assign(tree, await buildFullTree(masterHandle, posix.join(dir, folder.name)));
    }));
    return tree;
};

const createFolderFn = async (masterHandle, dir, name) => {
    const fullDir = posix.join(dir, name);
    if (name.indexOf("/") > 0 || name.length > 2 ** 8)
        throw new Error("Invalid folder name");
    // recurively create containing folders first
    if (!await masterHandle.getFolderMeta(dir).catch(console.warn))
        await createFolder(masterHandle, posix.dirname(dir), posix.basename(dir));
    if (await masterHandle.getFolderMeta(fullDir).catch(console.warn))
        throw new Error("Folder already exists");
    // initialize as empty folder
    await masterHandle.createFolderMeta(fullDir).catch(console.warn);
    await masterHandle.setFolderMeta(fullDir, new FolderMeta({ name }));
    createMetaQueue(masterHandle, dir);
    masterHandle.metaQueue[dir].push({
        type: "add-folder",
        payload: new FolderEntryMeta({
            name,
            location: masterHandle.getFolderLocation(fullDir)
        })
    });
};
const createFolder = async (masterHandle, dir, name) => {
    dir = cleanPath(dir);
    const fullDir = posix.join(dir, name);
    if (masterHandle.metaFolderCreating[fullDir]) {
        // TODO: this is hacky
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (!masterHandle.metaFolderCreating[fullDir]) {
                    resolve();
                    clearInterval(interval);
                }
            }, 250);
        });
        return;
    }
    masterHandle.metaFolderCreating[fullDir] = true;
    await createFolderFn(masterHandle, dir, name);
    masterHandle.metaFolderCreating[fullDir] = false;
};

const createFolderMeta = async (masterHandle, dir) => {
    dir = cleanPath(dir);
    try {
        // TODO: verify folder can only be changed by the creating account
        await createMetadata$1(masterHandle.uploadOpts.endpoint, masterHandle, 
        // masterHandle.getFolderHDKey(dir),
        masterHandle.getFolderLocation(dir));
    }
    catch (err) {
        console.error(`Can't create folder metadata for folder ${dir}`);
        throw err;
    }
};

// Metadata as hexstring as of right now
async function deleteFile(endpoint, hdNode, fileID) {
    const payload = { fileID };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/delete", signedPayload);
}

const deleteVersion = async (masterHandle, dir, version) => {
    dir = cleanPath(dir);
    await deleteFile(masterHandle.uploadOpts.endpoint, masterHandle, 
    // only send the location, not the private key
    version.handle.slice(0, 64)).catch(err => {
        console.warn("version does not exist");
        console.warn(err);
    });
    createMetaQueue(masterHandle, dir);
    masterHandle.metaQueue[dir].push({
        type: "remove-version",
        payload: version
    });
};

const deleteFile$1 = async (masterHandle, dir, file) => {
    dir = cleanPath(dir);
    const meta = await getFolderMeta$1(masterHandle, dir);
    const existingFile = meta.files.find(f => file === f || file.name === f.name);
    // precondition for if file is no longer in the metadata
    if (!existingFile)
        return;
    for (let version of existingFile.versions) {
        await deleteVersion(masterHandle, dir, version);
    }
    createMetaQueue(masterHandle, dir);
    masterHandle.metaQueue[dir].push({
        type: "remove-file",
        payload: existingFile
    });
};

const deleteFolder = async (masterHandle, dir, folder) => {
    dir = cleanPath(dir);
    const fullDir = posix.join(dir, folder.name);
    if (folder.name.indexOf("/") > 0 || folder.name.length > 2 ** 8)
        throw new Error("Invalid folder name");
    const meta = await masterHandle.getFolderMeta(fullDir).catch(console.warn);
    if (meta) {
        await Promise.all([
            (async () => {
                try {
                    for (let folder of meta.folders) {
                        await masterHandle.deleteFolder(fullDir, folder);
                    }
                }
                catch (err) {
                    console.error("Failed to delete sub folders");
                    throw err;
                }
            })(),
            (async () => {
                try {
                    for (let file of meta.files) {
                        await masterHandle.deleteFile(fullDir, file);
                    }
                }
                catch (err) {
                    console.error("Failed to delete file");
                    throw err;
                }
            })()
        ]);
    }
    try {
        await masterHandle.deleteFolderMeta(fullDir);
    }
    catch (err) {
        console.error("Failed to delete meta entry");
        throw err;
    }
    createMetaQueue(masterHandle, dir);
    masterHandle.metaQueue[dir].push({
        type: "remove-folder",
        payload: folder
    });
};

const deleteFolderMeta = async (masterHandle, dir) => {
    dir = cleanPath(dir);
    // TODO: verify folder can only be changed by the creating account
    await deleteMetadata(masterHandle.uploadOpts.endpoint, masterHandle, 
    // masterHandle.getFolderHDKey(dir),
    masterHandle.getFolderLocation(dir));
};

const isExpired = async (masterHandle) => {
    try {
        const accountInfoResponse = await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle);
        return accountInfoResponse.data.paymentStatus == "expired";
    }
    catch {
        return false;
    }
};

const login = async (masterHandle) => {
    // only attempt changes if account is paid
    if (!await isPaid(masterHandle)) {
        return;
    }
    // try newer meta
    try {
        await masterHandle.getFolderMeta("/");
    }
    catch (err) {
        // try older meta
        try {
            const meta = await getFolderMeta(masterHandle, "/");
            await masterHandle.deleteFolderMeta("/").catch(console.warn);
            await masterHandle.createFolderMeta("/").catch(console.warn);
            console.info("--- META ---", meta);
            await masterHandle.setFolderMeta("/", new FolderMeta(meta));
        }
        catch (err) {
            // no meta exists
            // set meta to an empty meta
            console.warn(err);
            await masterHandle.createFolderMeta("/").catch(console.warn);
            await masterHandle.setFolderMeta("/", new FolderMeta());
        }
    }
};

const moveFile = async (masterHandle, dir, { file, to }) => {
    dir = cleanPath(dir);
    const meta = await getFolderMeta$1(masterHandle, dir).catch(console.warn), toMeta = await getFolderMeta$1(masterHandle, to).catch(console.warn);
    if (!meta)
        throw new Error("Folder does not exist");
    if (!toMeta)
        throw new Error("Can't move to folder that doesn't exist");
    const existingFile = meta.files.find(f => file === f || file.name === f.name);
    // file is no longer in the metadata
    if (!existingFile)
        throw new Error("File no longer exists");
    createMetaQueue(masterHandle, dir);
    createMetaQueue(masterHandle, to);
    masterHandle.metaQueue[dir].push({
        type: "remove-file",
        payload: existingFile
    });
    masterHandle.metaQueue[to].push({
        type: "add-file",
        payload: existingFile
    });
};

const moveFolder = async (masterHandle, dir, { folder, to }) => {
    dir = cleanPath(dir);
    const oldDir = posix.join(dir, folder.name), newDir = posix.join(to, folder.name);
    const folderMeta = await getFolderMeta$1(masterHandle, oldDir).catch(console.warn), outerMeta = await getFolderMeta$1(masterHandle, dir).catch(console.warn), toMeta = await getFolderMeta$1(masterHandle, to).catch(console.warn);
    if (!folderMeta)
        throw new Error("Folder does not exist");
    if (!outerMeta)
        throw new Error("Outer folder does not exist");
    if (!toMeta)
        throw new Error("Can't move to folder that doesn't exist");
    if (await getFolderMeta$1(masterHandle, newDir).catch(console.warn))
        throw new Error("Folder already exists");
    const existingFolder = outerMeta.folders.find(f => folder === f || folder.name === f.name);
    // folder is no longer in the metadata
    if (!existingFolder)
        throw new Error("File no longer exists");
    await createFolderMeta(masterHandle, newDir).catch(console.warn);
    await setFolderMeta(masterHandle, newDir, await getFolderMeta$1(masterHandle, oldDir));
    await deleteFolderMeta(masterHandle, oldDir);
    createMetaQueue(masterHandle, dir);
    createMetaQueue(masterHandle, to);
    masterHandle.metaQueue[dir].push({
        type: "remove-folder",
        payload: existingFolder
    });
    masterHandle.metaQueue[to].push({
        type: "add-folder",
        payload: existingFolder
    });
};

const renameFile = async (masterHandle, dir, { file, name }) => {
    dir = cleanPath(dir);
    const meta = await getFolderMeta$1(masterHandle, dir).catch(console.warn);
    if (!meta)
        throw new Error("Folder does not exist");
    const existingFile = meta.files.find(f => file === f || file.name === f.name);
    // file is no longer in the metadata
    if (!existingFile)
        throw new Error("File no longer exists");
    createMetaQueue(masterHandle, dir);
    masterHandle.metaQueue[dir].push({
        type: "remove-file",
        payload: existingFile
    });
    masterHandle.metaQueue[dir].push({
        type: "add-file",
        payload: new FileEntryMeta({
            ...existingFile,
            name
        })
    });
};

const renameFolder = async (masterHandle, dir, { folder, name }) => {
    dir = cleanPath(dir);
    if (name.indexOf("/") > 0 || name.length > 2 ** 8)
        throw new Error("Invalid folder name");
    const oldDir = posix.join(dir, folder.name), newDir = posix.join(dir, name);
    const folderMeta = await getFolderMeta$1(masterHandle, dir).catch(console.warn), meta = await getFolderMeta$1(masterHandle, dir).catch(console.warn);
    if (!folderMeta)
        throw new Error("Folder does not exist");
    if (!meta)
        throw new Error("Outer folder does not exist");
    if (await getFolderMeta$1(masterHandle, newDir).catch(console.warn))
        throw new Error("Folder already exists");
    const existingFolder = meta.folders.find(f => folder === f || folder.name === f.name);
    // folder is no longer in the metadata
    if (!existingFolder)
        throw new Error("Folder no longer exists");
    await createFolder(masterHandle, dir, name);
    await setFolderMeta(masterHandle, newDir, await getFolderMeta$1(masterHandle, oldDir));
    await deleteFolderMeta(masterHandle, oldDir);
    createMetaQueue(masterHandle, dir);
    masterHandle.metaQueue[dir].push({
        type: "remove-folder",
        payload: existingFolder
    });
    masterHandle.metaQueue[dir].push({
        type: "add-folder",
        payload: new FolderEntryMeta({
            name,
            location: getFolderLocation(masterHandle, newDir)
        })
    });
};

/**
 * check the status of renewing an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKeys - all metadata keys from the account to renew
 * @param fileHandles - all file handles from the account to renew
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
async function renewAccountStatus(endpoint, hdNode, metadataKeys, fileHandles, duration = 12) {
    const payload = {
        metadataKeys,
        fileHandles,
        durationInMonths: duration
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/renew", signedPayload);
}
/**
 * request an invoice for renewing an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
async function renewAccountInvoice(endpoint, hdNode, duration = 12) {
    const payload = {
        durationInMonths: duration
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/renew/invoice", signedPayload);
}

const renewAccount = async (masterHandle, duration) => {
    const tree = await buildFullTree(masterHandle, "/");
    const metadataKeys = Object.keys(tree).map(dir => getFolderLocation(masterHandle, dir));
    const fileHandles = Object.values(tree).map(folder => folder.files.map(file => file.versions.map(version => version.handle.slice(0, 64)))).flat(2);
    console.log(metadataKeys, fileHandles);
    const renewAccountInvoiceResponse = await renewAccountInvoice(masterHandle.uploadOpts.endpoint, masterHandle, duration);
    console.log(renewAccountInvoiceResponse);
    const renewAccountStatusOpts = [
        masterHandle.uploadOpts.endpoint,
        masterHandle,
        metadataKeys,
        fileHandles,
        duration
    ];
    return {
        data: renewAccountInvoiceResponse.data,
        waitForPayment: () => new Promise(resolve => {
            const interval = setInterval(async () => {
                // don't perform run if it takes more than 5 seconds for response
                const time = Date.now();
                const renewAccountStatusResponse = await renewAccountStatus(...renewAccountStatusOpts);
                console.log(renewAccountStatusResponse);
                if (renewAccountStatusResponse.data.status
                    && renewAccountStatusResponse.data.status !== "Incomplete"
                    && time + 5 * 1000 > Date.now()) {
                    clearInterval(interval);
                    await masterHandle.login();
                    resolve({ data: renewAccountStatusResponse.data });
                }
            }, 10 * 1000);
        })
    };
};

/**
 * check the status of upgrading an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKeys - all metadata keys from the account to upgrade
 * @param fileHandles - all file handles from the account to upgrade
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
async function upgradeAccountStatus(endpoint, hdNode, metadataKeys, fileHandles, duration = 12, limit = 128) {
    const payload = {
        metadataKeys,
        fileHandles,
        durationInMonths: duration,
        storageLimit: limit
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/upgrade", signedPayload);
}
/**
 * request an invoice for upgrading an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
async function upgradeAccountInvoice(endpoint, hdNode, duration = 12, limit = 128) {
    const payload = {
        durationInMonths: duration,
        storageLimit: limit
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/upgrade/invoice", signedPayload);
}

const upgradeAccount = async (masterHandle, duration, limit) => {
    const tree = await buildFullTree(masterHandle, "/");
    const metadataKeys = Object.keys(tree).map(dir => getFolderLocation(masterHandle, dir));
    const fileHandles = Object.values(tree).map(folder => folder.files.map(file => file.versions.map(version => version.handle.slice(0, 64)))).flat(2);
    console.log(metadataKeys, fileHandles);
    const upgradeAccountInvoiceResponse = await upgradeAccountInvoice(masterHandle.uploadOpts.endpoint, masterHandle, duration, limit);
    console.log(upgradeAccountInvoiceResponse);
    const upgradeAccountStatusOpts = [
        masterHandle.uploadOpts.endpoint,
        masterHandle,
        metadataKeys,
        fileHandles,
        duration,
        limit
    ];
    return {
        data: upgradeAccountInvoiceResponse.data,
        waitForPayment: () => new Promise(resolve => {
            const interval = setInterval(async () => {
                // don't perform run if it takes more than 5 seconds for response
                const time = Date.now();
                const upgradeAccountStatusResponse = await upgradeAccountStatus(...upgradeAccountStatusOpts);
                console.log(upgradeAccountStatusResponse);
                if (upgradeAccountStatusResponse.data.status
                    && upgradeAccountStatusResponse.data.status !== "Incomplete"
                    && time + 5 * 1000 > Date.now()) {
                    clearInterval(interval);
                    await masterHandle.login();
                    resolve({ data: upgradeAccountStatusResponse.data });
                }
            }, 10 * 1000);
        })
    };
};

const uploadFile = (masterHandle, dir, file) => {
    dir = cleanPath(dir);
    const upload = new Upload(file, masterHandle, masterHandle.uploadOpts), ee = new EventEmitter();
    Object.assign(ee, { handle: upload.handle });
    upload.on("upload-progress", progress => {
        ee.emit("upload-progress", progress);
    });
    upload.on("error", err => {
        ee.emit("error", err);
    });
    upload.on("finish", async (finishedUpload) => {
        if (!await getFolderMeta$1(masterHandle, dir).catch(console.warn))
            await createFolder(masterHandle, posix.dirname(dir), posix.basename(dir));
        createMetaQueue(masterHandle, dir);
        masterHandle.metaQueue[dir].push({
            type: "add-file",
            payload: new FileEntryMeta({
                name: file.name,
                modified: file.lastModified,
                versions: [
                    new FileVersion({
                        handle: finishedUpload.handle,
                        size: file.size,
                        modified: file.lastModified
                    })
                ]
            })
        });
        masterHandle.metaQueue[dir].once("update", meta => {
            ee.emit("finish", finishedUpload);
        });
    });
    return ee;
};

/**
 * internal API v1
 *
 * @internal
 */
const v1 = {
    downloadFile,
    generateSubHDKey,
    getAccountInfo,
    getFolderHDKey,
    getFolderLocation,
    getHandle,
    isPaid,
    register,
    buildFullTree,
    createFolder,
    createFolderMeta,
    createMetaQueue,
    deleteFile: deleteFile$1,
    deleteFolder,
    deleteFolderMeta,
    deleteVersion,
    getFolderMeta: getFolderMeta$1,
    isExpired,
    login,
    moveFile,
    moveFolder,
    renameFile,
    renameFolder,
    renewAccount,
    setFolderMeta,
    upgradeAccount,
    uploadFile
};

/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for representing the account mnemonic
 *
 * @public
 */
class Account {
    /**
     * creates an account from a mnemonic if provided, otherwise from entropy
     *
     * @param mnemonic - the mnemonic to use for the account
     */
    constructor(mnemonic = generateMnemonic()) {
        if (!validateMnemonic(mnemonic)) {
            throw new Error("mnemonic provided was not valid");
        }
        this._mnemonic = mnemonic;
    }
    get mnemonic() {
        return this._mnemonic.trim().split(/\s+/g);
    }
    get seed() {
        return mnemonicToSeedSync(this._mnemonic);
    }
}
/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for creating a master handle from an account mnemonic
 *
 * @remarks
 *
 * a master handle is responsible for:
 *  <br /> - logging in to an account
 *  <br /> - signing changes for the account
 *  <br /> - deterministic entropy for generating features of an account (such as folder keys)
 *
 * @public
 */
class MasterHandle extends HDKey {
    /**
     * creates a master handle from an account
     *
     * @param _ - the account to generate the handle from
     * @param _.account - an {@link Account}
     * @param _.handle - an account handle as a string
     */
    constructor({ account, handle, }, { uploadOpts = {}, downloadOpts = {} } = {}) {
        super();
        this.metaQueue = {};
        this.metaFolderCreating = {};
        /**
         * creates a sub key seed for validating
         *
         * @param path - the string to use as a sub path
         */
        this.generateSubHDKey = (pathString) => generateSubHDKey(this, pathString);
        this.uploadFile = (dir, file) => uploadFile(this, dir, file);
        this.downloadFile = (handle) => downloadFile(this, handle);
        /**
         * deletes every version of a file and removes it from the metadata
         *
         * @param dir - the containing folder
         * @param file - file entry to delete (loosely matched name)
         */
        this.deleteFile = (dir, file) => deleteFile$1(this, dir, file);
        /**
         * deletes a single version of a file (ie. delete by handle)
         *
         * @param dir - the containing folder
         * @param version - version to delete (loosely matched by handle)
         */
        this.deleteVersion = (dir, version) => deleteVersion(this, dir, version);
        /**
         * creates a dir key seed for validating and folder navigation
         *
         * @param dir - the folder
         */
        this.getFolderHDKey = (dir) => getFolderHDKey(this, dir);
        /**
         * get the location (ie. metadata id) of a folder
         *
         * @remarks this is a deterministic location derived from the account's hdkey to allow for random folder access
         *
         * @param dir - the folder to locate
         */
        this.getFolderLocation = (dir) => getFolderLocation(this, dir);
        /**
         * request the creation of a folder metadata
         *
         * @param dir - the folder to create
         */
        this.createFolderMeta = async (dir) => createFolderMeta(this, dir);
        /**
         * create folder {name} inside of {dir}
         *
         * @param dir - the containing folder
         * @param name - the name of the new folder
         */
        this.createFolder = async (dir, name) => createFolder(this, dir, name);
        this.deleteFolderMeta = async (dir) => deleteFolderMeta(this, dir);
        this.deleteFolder = async (dir, folder) => deleteFolder(this, dir, folder);
        this.moveFile = async (dir, { file, to }) => moveFile(this, dir, { file, to });
        this.moveFolder = async (dir, { folder, to }) => moveFolder(this, dir, { folder, to });
        this.renameFile = async (dir, { file, name }) => renameFile(this, dir, { file, name });
        this.renameFolder = async (dir, { folder, name }) => renameFolder(this, dir, { folder, name });
        this.setFolderMeta = async (dir, folderMeta) => setFolderMeta(this, dir, folderMeta);
        this.getFolderMeta = async (dir) => getFolderMeta$1(this, dir);
        /**
         * recursively build full file tree starting from directory {dir}
         *
         * @param dir - the starting directory
         */
        this.buildFullTree = async (dir) => buildFullTree(this, dir);
        this.getAccountInfo = async () => getAccountInfo(this);
        this.isExpired = async () => isExpired(this);
        this.isPaid = async () => isPaid(this);
        this.login = async () => login(this);
        this.register = async (duration, limit) => register(this, duration, limit);
        this.upgrade = async (duration, limit) => upgradeAccount(this, duration, limit);
        this.renew = async (duration) => renewAccount(this, duration);
        this.uploadOpts = uploadOpts;
        this.downloadOpts = downloadOpts;
        if (account && account.constructor == Account) {
            const path = "m/43'/60'/1775'/0'/" + hashToPath(hash$1("opacity.io").replace(/^0x/, ""));
            // ethereum/EIPs#1775
            Object.assign(this, fromMasterSeed(account.seed).derive(path));
        }
        else if (handle && handle.constructor == String) {
            this.privateKey = Buffer.from(handle.slice(0, 64), "hex");
            this.chainCode = Buffer.from(handle.slice(64), "hex");
        }
        else {
            throw new Error("master handle was not of expected type");
        }
    }
    /**
     * get the account handle
     */
    get handle() {
        return getHandle(this);
    }
}

export { Account, Download, FileEntryMeta, FileVersion, FolderEntryMeta, FolderMeta, MasterHandle, MinifiedFileEntryMeta, MinifiedFileVersion, MinifiedFolderEntryMeta, MinifiedFolderMeta, Upload, checkPaymentStatus, createAccount, createMetadata$1 as createMetadata, deleteMetadata, getMetadata, getPayload, getPayloadFD, getPlans, setMetadata, v0, v1 };
//# sourceMappingURL=index.js.map
