'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Axios = _interopDefault(require('axios'));
var events = require('events');
var nodeForge = require('node-forge');
var isBuffer = _interopDefault(require('is-buffer'));
var readableStream = require('readable-stream');
var mime = _interopDefault(require('mime/lite'));
var FormDataNode = _interopDefault(require('form-data'));

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

const DEFAULT_OPTIONS = Object.freeze({
  objectMode: false
});
class FileSourceStream extends readableStream.Readable {
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
    const limit = Math.min(offset + blockSize, blob.size); // End stream when file is read in

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
class BufferSourceStream extends readableStream.Readable {
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
    const limit = Math.min(offset + blockSize, buf.length) - offset; // End stream when file is read in

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

const Forge = {
  md: nodeForge.md,
  random: nodeForge.random,
  util: nodeForge.util
};
const ByteBuffer = Forge.util.ByteBuffer; // Generate new handle, datamap entry hash and encryption key
// TODO: Decide on format and derivation

function generateFileKeys() {
  const hash = Forge.md.sha256.create().update(Forge.random.getBytesSync(32)).digest();
  const key = Forge.md.sha256.create().update(Forge.random.getBytesSync(32)).digest();
  const handle = hash.toHex() + key.toHex();
  return {
    hash: hash.toHex(),
    key,
    handle
  };
} // Return datamap hash and encryption key from handle
// TODO: Decide on format and derivation

function keysFromHandle(handle) {
  const bytes = Forge.util.binary.hex.decode(handle);
  const buf = new ByteBuffer(bytes);
  const hash = buf.getBytes(32);
  const key = buf.getBytes(32);
  return {
    hash: Forge.util.bytesToHex(hash),
    key: new ByteBuffer(key),
    handle
  };
}
function sanitizeFilename(filename) {
  if (filename.length > FILENAME_MAX_LENGTH) {
    const l = FILENAME_MAX_LENGTH / 2 - 2;
    const start = filename.substring(0, l);
    const end = filename.substring(filename.length - l);
    filename = start + "..." + end;
  }

  return filename;
} // Rudimentary format normalization

function getFileData(file, nameFallback = "file") {
  if (isBuffer(file)) {
    return {
      data: file,
      size: file.length,
      name: nameFallback,
      type: "application/octet-stream",
      reader: BufferSourceStream
    };
  } else if (file && file.data && isBuffer(file.data)) {
    return {
      data: file.data,
      size: file.data.length,
      name: file.name || nameFallback,
      type: file.type || mime.getType(file.name) || "application/octet-stream",
      reader: BufferSourceStream
    };
  } else {
    // TODO
    file.reader = FileSourceStream;
  }

  return file;
} // get true upload size, accounting for encryption overhead

function getUploadSize(size, params) {
  const blockSize = params.blockSize || DEFAULT_BLOCK_SIZE;
  const blockCount = Math.ceil(size / blockSize);
  return size + blockCount * BLOCK_OVERHEAD;
}

const Forge$1 = {
  cipher: nodeForge.cipher,
  md: nodeForge.md,
  util: nodeForge.util,
  random: nodeForge.random
};
const ByteBuffer$1 = Forge$1.util.ByteBuffer; // Encryption

function encrypt(key, byteBuffer) {
  key.read = 0;
  const iv = Forge$1.random.getBytesSync(IV_BYTE_LENGTH);
  const cipher = Forge$1.cipher.createCipher("AES-GCM", key);
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
function encryptString(key, string, encoding) {
  const buf = Forge$1.util.createBuffer(string, encoding || "utf8");
  return encrypt(key, buf);
}
function encryptBytes(key, bytes) {
  return encrypt(key, Forge$1.util.createBuffer(bytes));
} // Decryption

function decrypt(key, byteBuffer) {
  key.read = 0;
  byteBuffer.read = byteBuffer.length() - BLOCK_OVERHEAD;
  const tag = byteBuffer.getBytes(TAG_BYTE_LENGTH);
  const iv = byteBuffer.getBytes(IV_BYTE_LENGTH);
  const decipher = Forge$1.cipher.createDecipher("AES-GCM", key);
  byteBuffer.read = 0;
  byteBuffer.truncate(BLOCK_OVERHEAD);
  decipher.start({
    iv,
    tag,
    tagLength: TAG_BIT_LENGTH
  });
  decipher.update(byteBuffer);

  if (decipher.finish()) {
    return decipher.output;
  } else {
    return false;
  }
}
function decryptBytes(key, bytes) {
  const buf = new ByteBuffer$1(bytes);
  const output = decrypt(key, buf);

  if (output) {
    return Forge$1.util.binary.raw.decode(output.getBytes());
  } else {
    return false;
  }
}
function decryptString(key, byteBuffer, encoding = "utf8") {
  const output = decrypt(key, byteBuffer);

  if (output) {
    return new Buffer(output.toString()).toString(encoding);
  } else {
    throw new Error("unable to decrypt");
  }
}

const Forge$2 = {
  util: nodeForge.util
};
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
class DecryptStream extends readableStream.Transform {
  constructor(key, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS$2, options);
    super(opts);
    this.options = opts;
    this.key = key;
    this.iter = 0;
  }

  _transform(chunk, encoding, callback) {
    const blockSize = this.options.blockSize;
    const chunkSize = blockSize + BLOCK_OVERHEAD;
    const length = chunk.length;

    for (let offset = 0; offset < length; offset += chunkSize) {
      const limit = Math.min(offset + chunkSize, length);
      const buf = chunk.slice(offset, limit);
      const data = decryptBytes(this.key, buf);

      if (data) {
        this.push(data);
      } else {
        this.emit("error", "Error decrypting data block");
      }
    }

    callback(null);
  }

}

const DEFAULT_OPTIONS$3 = Object.freeze({
  maxParallelDownloads: 1,
  maxRetries: 0,
  partSize: 80 * (DEFAULT_BLOCK_SIZE + BLOCK_OVERHEAD),
  objectMode: false
});
class DownloadStream extends readableStream.Readable {
  constructor(hash, metadata, size, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS$3, options);
    super(opts); // Input

    this.options = opts;
    this.hash = hash;
    this.size = size;
    this.metadata = metadata;
    this.numChunks = Math.ceil(size / opts.partSize); // Internal

    this.chunks = [];
    this.chunkId = 0;
    this.pushId = 0;
    this.bytesDownloaded = 0;
    this.isDownloadFinished = false;
    this.ongoingDownloads = 0;
    this.pushChunk = false;
    const blockSize = metadata.p.blockSize || DEFAULT_BLOCK_SIZE;
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

  _download(chunkIndex) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const hash = _this.hash;
      const size = _this.size;
      const partSize = _this.options.partSize;
      const index = chunkIndex || _this.chunks.length;
      const offset = index * partSize; // TODO: Make sure last byte works to prevent edge case

      if (offset >= size) {
        _this.isDownloadFinished = true;
        return;
      }

      const limit = Math.min(offset + partSize, size) - offset;
      const range = `bytes=${offset}-${offset + limit - 1}`;
      const chunk = {
        id: _this.chunkId++,
        data: null,
        offset,
        limit
      };

      try {
        _this.chunks.push(chunk);

        _this.ongoingDownloads++;
        const download = yield Axios.get(_this.options.endpoint + "/download/file/" + _this.hash, {
          responseType: "arraybuffer",
          headers: {
            range
          }
        });
        chunk.data = download.data;
        _this.bytesDownloaded += chunk.data.length;
        _this.ongoingDownloads--;

        _this.emit("progress", _this.bytesDownloaded / _this.size);

        _this._pushChunk();
      } catch (error) {
        _this.ongoingDownloads--;

        _this.emit("error", error);
      }

      return;
    })();
  }

  _afterDownload() {
    return _asyncToGenerator(function* () {})();
  }

  _pushChunk() {
    if (!this.pushChunk) {
      return;
    }

    const chunk = this.chunks[this.pushId];

    if (chunk && chunk.data !== null) {
      this.pushId++;
      this.pushChunk = this.push(new Uint8Array(chunk.data));
      chunk.data = null;

      this._pushChunk();
    } else if (this.ongoingDownloads === 0 && this.isDownloadFinished) {
      this.push(null);
    }
  }

}

const METADATA_PATH = "/download/metadata/";
const DEFAULT_OPTIONS$4 = Object.freeze({
  autoStart: true
});
/**
 * Downloading files
 */

class Download extends events.EventEmitter {
  constructor(handle, opts) {
    const options = Object.assign({}, DEFAULT_OPTIONS$4, opts);

    const _keysFromHandle = keysFromHandle(handle),
          hash = _keysFromHandle.hash,
          key = _keysFromHandle.key;

    super();
    this.startDownload = this.startDownload.bind(this);
    this.propagateError = this.propagateError.bind(this);
    this.finishDownload = this.finishDownload.bind(this);
    this.options = options;
    this.handle = handle;
    this.hash = hash;
    this.key = key;
    this.metadataRequest = null;
    this.isDownloading = false;

    if (options.autoStart) {
      this.startDownload();
    }
  }

  get metadata() {
    var _this = this;

    return new Promise(
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(function* (resolve) {
        if (_this._metadata) {
          resolve(_this._metadata);
        } else {
          resolve((yield _this.downloadMetadata()));
        }
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
  }

  toBuffer() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const chunks = [];
      let totalLength = 0;

      if (typeof Buffer === "undefined") {
        return false;
      }

      yield _this2.startDownload();
      return new Promise(resolve => {
        _this2.decryptStream.on("data", data => {
          chunks.push(data);
          totalLength += data.length;
        });

        _this2.decryptStream.once("finish", () => {
          resolve(Buffer.concat(chunks, totalLength));
        });
      });
    })();
  }

  toFile() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const chunks = [];
      let totalLength = 0;
      yield _this3.startDownload();
      return new Promise(resolve => {
        _this3.decryptStream.on("data", data => {
          chunks.push(data);
          totalLength += data.length;
        });

        _this3.decryptStream.once("finish",
        /*#__PURE__*/
        _asyncToGenerator(function* () {
          resolve(new File(chunks, (yield _this3.metadata).name, {
            type: "text/plain"
          }));
        }));
      });
    })();
  }

  startDownload() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      try {
        yield _this4.downloadMetadata();
        yield _this4.downloadFile();
      } catch (e) {
        _this4.propagateError(e);
      }
    })();
  }

  downloadMetadata(overwrite = false) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      let req;

      if (!overwrite && _this5.metadataRequest) {
        req = _this5.metadataRequest;
      } else {
        const endpoint = _this5.options.endpoint;
        const path = METADATA_PATH + _this5.hash;
        req = _this5.metadataRequest = Axios.get(endpoint + path, {
          responseType: "arraybuffer"
        });
      }

      const res = yield req;
      const metadata = decryptMetadata(new Uint8Array(res.data), _this5.key);
      _this5._metadata = metadata;
      _this5.size = getUploadSize(metadata.size, metadata.p || {});
      return metadata;
    })();
  }

  downloadFile() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      if (_this6.isDownloading) {
        return true;
      }

      _this6.isDownloading = true;
      _this6.downloadStream = new DownloadStream(_this6.hash, (yield _this6.metadata), _this6.size, {
        endpoint: _this6.options.endpoint
      });
      _this6.decryptStream = new DecryptStream(_this6.key); // this.targetStream = new targetStream(this.metadata);

      _this6.downloadStream.on("progress", progress => {
        _this6.emit("download-progress", {
          target: _this6,
          handle: _this6.handle,
          progress: progress
        });
      });

      _this6.downloadStream.pipe(_this6.decryptStream);

      _this6.downloadStream.on("error", _this6.propagateError);

      _this6.decryptStream.on("error", _this6.propagateError);
    })();
  }

  finishDownload(error) {
    if (error) {
      this.propagateError(error);
    } else {
      this.emit("finish");
    }
  }

  propagateError(error) {
    process.nextTick(() => this.emit("error", error));
  }

}

const Forge$3 = {
  util: nodeForge.util
};
const DEFAULT_OPTIONS$5 = Object.freeze({
  objectMode: false
});
class EncryptStream extends readableStream.Transform {
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

const POLYFILL_FORMDATA = typeof FormData === "undefined";
const DEFAULT_OPTIONS$6 = Object.freeze({
  maxParallelUploads: 2,
  maxRetries: 0,
  partSize: 256,
  objectMode: false
});
class UploadStream extends readableStream.Writable {
  constructor(account, hash, size, endpoint, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS$6, options);
    super(opts); // Input

    this.account = account;
    this.hash = hash;
    this.endpoint = endpoint;
    this.options = opts;
    this.size = size;
    this.endIndex = Math.ceil(size / opts.partSize);
    console.log(`Uploading new file with ${this.endIndex} parts.`); // Internal

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
    } else if (this.ongoingUploads === 0) {
      callback();
    }
  } // Flatten inputs into a single ArrayBuffer for sending


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
    this.ongoingUploads++; // Cork stream when busy

    if (this.ongoingUploads === this.options.maxParallelUploads) {
      this.cork();
    }

    const data = new FormDataNode();
    const filename = `${this.hash}.${part.partIndex}.part`;
    const raw = POLYFILL_FORMDATA ? Buffer.from(part.data.buffer) : new Blob([part.data], {
      type: "application/octet-stream"
    });
    const length = raw.size ? raw.size : raw.length; // TODO: Actual account / signature

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
      onUploadProgress: event => {
        return;
      }
    }).then(result => {
      this._afterUpload(part);
    }).catch(error => {
      this._uploadError(error, part);
    });
  }

  _afterUpload(part) {
    this.ongoingUploads--;
    this.bytesUploaded += part.data.length; // TODO: Progress

    this.emit("progress", this.bytesUploaded / this.size); // Upload until done

    if (this.partBuffer.length > 0) {
      return this._attemptUpload();
    }

    if (this.finalCallback) {
      // Finish
      if (this.ongoingUploads === 0) {
        this.finalCallback();
      }
    } else {
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
    } else {
      this.emit("error", error);
      this.end();
    }
  }

}

const POLYFILL_FORMDATA$1 = typeof FormData === "undefined";
const DEFAULT_OPTIONS$7 = Object.freeze({
  autoStart: true
});
const DEFAULT_FILE_PARAMS = {
  blockSize: 64 * 1024
};
class Upload extends events.EventEmitter {
  constructor(file, account, opts) {
    const options = Object.assign({}, DEFAULT_OPTIONS$7, opts || {});
    options.params = Object.assign({}, DEFAULT_FILE_PARAMS, options.params || {});

    const _generateFileKeys = generateFileKeys(),
          handle = _generateFileKeys.handle,
          hash = _generateFileKeys.hash,
          key = _generateFileKeys.key;

    const data = getFileData(file, handle);
    const size = getUploadSize(file.size, options.params);
    super();
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

  startUpload() {
    var _this = this;

    return _asyncToGenerator(function* () {
      try {
        yield _this.uploadMetadata();
        yield _this.uploadFile();
      } catch (e) {
        _this.propagateError(e);
      }
    })();
  }

  uploadMetadata() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      const meta = createMetadata(_this2.data, _this2.options.params);
      const encryptedMeta = encryptMetadata(meta, _this2.key);
      const data = new FormDataNode();
      const raw = POLYFILL_FORMDATA$1 ? Buffer.from(encryptedMeta.buffer) : new Blob([encryptedMeta], {
        type: "application/octet-stream"
      });
      const length = raw.size ? raw.size : raw.length; // TODO: Actual account

      data.append("account", _this2.account); // TODO: Use separate metadata hash

      data.append("hash", _this2.hash); // Just used to prematurely return an error if not enough space

      data.append("size", _this2.uploadSize);
      data.append("metadata", raw, {
        filename: 'metadata',
        contentType: "application/octet-stream",
        knownLength: length
      });
      return Axios.put(_this2.options.endpoint + "/upload/metadata", data, {
        headers: data.getHeaders ? data.getHeaders() : {}
      }).then(res => {
        _this2.emit("metadata", meta);
      }).catch(error => {
        _this2.propagateError(error);
      });
    })();
  }

  uploadFile() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      const readStream = new _this3.data.reader(_this3.data, _this3.options.params);
      _this3.readStream = readStream;
      _this3.encryptStream = new EncryptStream(_this3.key, _this3.options.params);
      _this3.uploadStream = new UploadStream(_this3.account, _this3.hash, _this3.uploadSize, _this3.options.endpoint, _this3.options.params);

      _this3.uploadStream.on("progress", progress => {
        _this3.emit("upload-progress", {
          target: _this3,
          handle: _this3.handle,
          progress
        });
      });

      _this3.readStream.pipe(_this3.encryptStream).pipe(_this3.uploadStream).on("finish", _this3.finishUpload);

      _this3.readStream.on("error", _this3.propagateError);

      _this3.encryptStream.on("error", _this3.propagateError);

      _this3.uploadStream.on("error", _this3.propagateError);
    })();
  }

  finishUpload() {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      _this4.emit("finish", {
        target: _this4,
        handle: _this4.handle,
        metadata: _this4.metadata
      });
    })();
  }

  propagateError(error) {
    process.nextTick(() => this.emit("error", error));
  }

}

class AccountMeta {
  constructor({
    planSize,
    paidUntil,
    preferences = {}
  }) {
    this.planSize = planSize;
    this.paidUntil = paidUntil;
    this.preferences = preferences;
  }

  setPreference(key, preference) {
    Object.assign(this.preferences[key], preference);
  }

}

class AccountPreferences {
  constructor(obj) {
    Object.assign(this, obj);
  }

}
/**
 * a metadata class to describe a file as it relates to the UI
 */


class FileEntryMeta {
  /**
   * create metadata for a file entry in the UI
   *
   * @param name - the name of the file as shown in the UI
   * @param created - the date in `ms` that this file was initially updated
   * @param hidden - if the file should be hidden (this could also be automatically generated within the UI, ie. `.files`)
   * @param locked - if the file is encrypted
     *   (will require password in the UI, may need bytes prefixed to meta to determine whether it was encrypted)
   * @param versions - versions of the uploaded file (the most recent of which should be the current version of the file)
   * @param tags - tags assigned to the file for organization/searching
   */
  constructor({
    name,
    created = Date.now(),
    hidden = false,
    locked = false,
    versions = [],
    tags = []
  }) {
    this.name = name;
    this.created = created;
    this.hidden = hidden;
    this.locked = locked;
    this.versions = versions;
    this.tags = tags;
  }

}
/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */


class FileVersion {
  /**
   * create metadata for a file version
   *
   * @param size - size in bytes of the file
   * @param location - location on the network of the file
   * @param hash - a hash of the file
     *   NOTE: probably `sha1`
   * @param modified - the date in `ms` that this version of the file was originally changed
   */
  constructor({
    size,
    location,
    hash,
    modified = Date.now()
  }) {
    this.size = size;
    this.location = location;
    this.hash = hash;
    this.modified = modified;
  }

}
/**
 * a metadata class to describe where a folder can be found (for root metadata of an account)
 */


class FolderEntryMeta {
  /**
   * create metadata entry for a folder
   *
   * @param name - a name of the folder shown in the UI
   * @param location - the public key for the metadata file
   *   it is how the file will be queried for (using the same system as for the account metadata)
   */
  constructor({
    name,
    location
  }) {
    this.name = name;
    this.location = location;
  }

}
/**
 * a metadata class to describe a folder for the UI
 */


class FolderMeta {
  /**
   * create metadata for a folder
   *
   * @param name - a nickname shown on the folder when accessed without adding to account metadata
   * @param files - the files included only in the most shallow part of the folder
   * @param created - when the folder was created (if not created now) in `ms`
   * @param hidden - if the folder should be hidden (this could also be automatically generated within the UI)
   * @param locked - if the folder's metadata is encrypted (will require password in the UI)
   *  NOTE: may need bytes prefixed to meta to determine whether it was encrypted
   * @param tags - tags assigned to the folder for organization/searching
   */
  constructor({
    name,
    files = [],
    created = Date.now(),
    hidden = false,
    locked = false,
    tags = []
  }) {
    this.name = name;
    this.files = files;
    this.created = created;
    this.hidden = hidden;
    this.locked = locked;
    this.tags = tags;
  }

}

exports.AccountMeta = AccountMeta;
exports.AccountPreferences = AccountPreferences;
exports.Download = Download;
exports.FileEntryMeta = FileEntryMeta;
exports.FileVersion = FileVersion;
exports.FolderEntryMeta = FolderEntryMeta;
exports.FolderMeta = FolderMeta;
exports.Upload = Upload;
