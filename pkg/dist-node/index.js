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
var EthUtil = require('ethereumjs-util');
var bip39 = require('bip39');
var HDKey = require('hdkey');
var HDKey__default = _interopDefault(HDKey);
var namehash = require('eth-ens-namehash');
var web3Utils = require('web3-utils');

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
  const hash = Forge.md.sha256.create().update(Forge.random.getBytesSync(32)).digest().toHex();
  const key = Forge.md.sha256.create().update(Forge.random.getBytesSync(32)).digest().toHex();
  const handle = hash + key;
  return {
    hash,
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
    key: Forge.util.bytesToHex(key),
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
    file = file;
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
} // get

function getEndIndex(uploadSize, params) {
  const blockSize = params.blockSize || DEFAULT_BLOCK_SIZE;
  const chunkSize = blockSize + BLOCK_OVERHEAD;
  const chunkCount = Math.ceil(uploadSize / chunkSize);
  const chunksPerPart = Math.ceil(params.partSize / chunkSize);
  const endIndex = Math.ceil(chunkCount / chunksPerPart);
  return endIndex;
}

const Forge$1 = {
  cipher: nodeForge.cipher,
  md: nodeForge.md,
  util: nodeForge.util,
  random: nodeForge.random
};
const ByteBuffer$1 = Forge$1.util.ByteBuffer; // Encryption

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
} // Decryption

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
  autostart: true,
  maxParallelDownloads: 1,
  maxRetries: 0,
  partSize: 80 * (DEFAULT_BLOCK_SIZE + BLOCK_OVERHEAD),
  objectMode: false
});
class DownloadStream extends readableStream.Readable {
  constructor(url, metadata, size, options = {}) {
    const opts = Object.assign({}, DEFAULT_OPTIONS$3, options);
    super(opts); // Input

    this.options = opts;
    this.url = url;
    this.size = size;
    this.metadata = metadata; // Internal

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
        const download = yield Axios.get(_this.url + "/file", {
          responseType: "arraybuffer",
          headers: {
            range
          }
        });
        chunk.data = new Uint8Array(download.data);
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
      this.pushChunk = this.push(chunk.data);
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
  constructor(handle, opts = {}) {
    var _this;

    super();
    _this = this;
    this.toBuffer =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const chunks = [];
      let totalLength = 0;

      if (typeof Buffer === "undefined") {
        return false;
      }

      yield _this.startDownload();
      return new Promise(resolve => {
        _this.decryptStream.on("data", data => {
          chunks.push(data);
          totalLength += data.length;
        });

        _this.decryptStream.once("finish", () => {
          resolve(Buffer.concat(chunks, totalLength));
        });
      });
    });
    this.toFile =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const chunks = [];
      let totalLength = 0;
      yield _this.startDownload();
      return new Promise(resolve => {
        _this.decryptStream.on("data", data => {
          chunks.push(data);
          totalLength += data.length;
        });

        _this.decryptStream.once("finish",
        /*#__PURE__*/
        _asyncToGenerator(function* () {
          resolve(new File(chunks, (yield _this.metadata).name, {
            type: "text/plain"
          }));
        }));
      });
    });
    this.startDownload =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      try {
        yield _this.getDownloadURL();
        yield _this.downloadMetadata();
        yield _this.downloadFile();
      } catch (e) {
        _this.propagateError(e);
      }
    });

    this.downloadMetadata =
    /*#__PURE__*/
    function () {
      var _ref5 = _asyncToGenerator(function* (overwrite = false) {
        let req;

        if (!_this.downloadURL) {
          yield _this.getDownloadURL();
        }

        if (!overwrite && _this.metadataRequest) {
          req = _this.metadataRequest;
        } else {
          const endpoint = _this.options.endpoint;
          const path = METADATA_PATH + _this.hash;
          req = Axios.get(_this.downloadURL + "/metadata", {
            responseType: "arraybuffer"
          });
          _this.metadataRequest = req;
        }

        const res = yield req;
        const metadata = decryptMetadata(new Uint8Array(res.data), _this.key);
        _this._metadata = metadata;
        _this.size = getUploadSize(metadata.size, metadata.p || {});
        return metadata;
      });

      return function () {
        return _ref5.apply(this, arguments);
      };
    }();

    this.downloadFile =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      if (_this.isDownloading) {
        return true;
      }

      _this.isDownloading = true;
      _this.downloadStream = new DownloadStream(_this.downloadURL, (yield _this.metadata), _this.size);
      _this.decryptStream = new DecryptStream(_this.key); // this.targetStream = new targetStream(this.metadata);

      _this.downloadStream.on("progress", progress => {
        _this.emit("download-progress", {
          target: _this,
          handle: _this.handle,
          progress: progress
        });
      });

      _this.downloadStream.pipe(_this.decryptStream);

      _this.downloadStream.on("error", _this.propagateError);

      _this.decryptStream.on("error", _this.propagateError);
    });

    this.finishDownload = error => {
      if (error) {
        this.propagateError(error);
      } else {
        this.emit("finish");
      }
    };

    this.propagateError = error => {
      process.nextTick(() => this.emit("error", error));
    };

    const options = Object.assign({}, DEFAULT_OPTIONS$4, opts);

    const _keysFromHandle = keysFromHandle(handle),
          hash = _keysFromHandle.hash,
          key = _keysFromHandle.key;

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

  get metadata() {
    var _this2 = this;

    return new Promise(
    /*#__PURE__*/
    function () {
      var _ref7 = _asyncToGenerator(function* (resolve) {
        if (_this2._metadata) {
          resolve(_this2._metadata);
        } else {
          resolve((yield _this2.downloadMetadata()));
        }
      });

      return function (_x) {
        return _ref7.apply(this, arguments);
      };
    }());
  }

  getDownloadURL(overwrite = false) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      let req;

      if (!overwrite && _this3.downloadURLRequest) {
        req = _this3.downloadURLRequest;
      } else {
        req = Axios.post(_this3.options.endpoint + "/api/v1/download", {
          fileID: _this3.hash
        });
        _this3.downloadURLRequest = req;
      }

      const res = yield req;

      if (res.status === 200) {
        _this3.downloadURL = res.data.fileDownloadUrl;
        return _this3.downloadURL;
      }
    })();
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

function checkPaymentStatus(_x, _x2) {
  return _checkPaymentStatus.apply(this, arguments);
}

function _checkPaymentStatus() {
  _checkPaymentStatus = _asyncToGenerator(function* (endpoint, hdNode) {
    const payload = {
      timestamp: Math.floor(Date.now() / 1000)
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/account-data", signedPayload);
  });
  return _checkPaymentStatus.apply(this, arguments);
}

function createAccount(_x, _x2, _x3) {
  return _createAccount.apply(this, arguments);
}

function _createAccount() {
  _createAccount = _asyncToGenerator(function* (endpoint, hdNode, metadataKey) {
    const payload = {
      metadataKey: metadataKey,
      durationInMonths: 12,
      // TODO: I'm not sure why this is like this, but it doesn't match what was planned
      storageLimit: 128
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/accounts", signedPayload);
  });
  return _createAccount.apply(this, arguments);
}

function setMetadata(_x, _x2, _x3, _x4) {
  return _setMetadata.apply(this, arguments);
}

function _setMetadata() {
  _setMetadata = _asyncToGenerator(function* (endpoint, hdNode, metadataKey, metadata) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = {
      timestamp,
      metadata,
      metadataKey
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/set", signedPayload);
  });
  return _setMetadata.apply(this, arguments);
}

function getMetadata(_x5, _x6, _x7) {
  return _getMetadata.apply(this, arguments);
}

function _getMetadata() {
  _getMetadata = _asyncToGenerator(function* (endpoint, hdNode, metadataKey) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = {
      timestamp,
      metadataKey
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/metadata/get", signedPayload);
  });
  return _getMetadata.apply(this, arguments);
}

const POLYFILL_FORMDATA = typeof FormData === "undefined";
function getPayload(rawPayload, hdNode, key = "requestBody") {
  const payload = JSON.stringify(rawPayload);
  const hash = EthUtil.keccak256(payload);
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
function getPayloadFD(rawPayload, extraPayload, hdNode, key = "requestBody") {
  // rawPayload.timestamp = Date.now();
  const payload = JSON.stringify(rawPayload);
  const hash = EthUtil.keccak256(payload);
  const signature = hdNode.sign(hash).toString("hex");
  const pubKey = hdNode.publicKey.toString("hex"); // node, buffers

  if (POLYFILL_FORMDATA) {
    const data = new FormDataNode();
    data.append(key, payload);
    data.append("signature", signature);
    data.append("publicKey", pubKey); // data.append("hash", hash);

    if (extraPayload) {
      Object.keys(extraPayload).forEach(key => {
        const pl = extraPayload[key];
        data.append(key, pl, {
          filename: key,
          contentType: "application/octet-stream",
          knownLength: pl.length
        });
      });
    }

    return data;
  } else {
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
    this.endIndex = getEndIndex(size, opts); // Internal

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

    const data = getPayloadFD({
      fileHandle: this.hash,
      partIndex: part.partIndex,
      endIndex: this.endIndex
    }, {
      chunkData: part.data
    }, this.account);
    const upload = Axios.post(this.endpoint + "/api/v1/upload", data, {
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
    this.bytesUploaded += part.data.length;
    this.emit("progress", this.bytesUploaded / this.size); // Upload until done

    if (this.partBuffer.length > 0) {
      return this._attemptUpload();
    }

    if (this.finalCallback) {
      // Finish
      if (this.ongoingUploads === 0) {
        this._finishUpload();
      }
    } else {
      // Continue
      process.nextTick(() => this.uncork());
    }
  }

  _finishUpload() {
    var _this = this;

    return _asyncToGenerator(function* () {
      const data = getPayload({
        fileHandle: _this.hash
      }, _this.account);
      const req = Axios.post(_this.endpoint + "/api/v1/upload-status", data);
      const res = yield req;

      _this.finalCallback();
    })();
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

const DEFAULT_OPTIONS$7 = Object.freeze({
  autoStart: true
});
const DEFAULT_FILE_PARAMS = {
  blockSize: 64 * 1024
};
class Upload extends events.EventEmitter {
  constructor(file, account, opts = {}) {
    var _this;

    super();
    _this = this;
    this.startUpload =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      try {
        yield _this.uploadMetadata();
        yield _this.uploadFile();
      } catch (e) {
        _this.propagateError(e);
      }
    });
    this.uploadMetadata =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const meta = createMetadata(_this.data, _this.options.params);
      const encryptedMeta = encryptMetadata(meta, _this.key);
      const data = getPayloadFD({
        fileHandle: _this.hash,
        fileSizeInByte: _this.uploadSize,
        endIndex: getEndIndex(_this.uploadSize, _this.options.params)
      }, {
        metadata: encryptedMeta
      }, _this.account);
      return Axios.post(_this.options.endpoint + "/api/v1/init-upload", data, {
        headers: data.getHeaders ? data.getHeaders() : {}
      }).then(res => {
        _this.emit("metadata", meta);
      }).catch(error => {
        _this.propagateError(error);
      });
    });
    this.uploadFile =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      const readStream = new _this.data.reader(_this.data, _this.options.params);
      _this.readStream = readStream;
      _this.encryptStream = new EncryptStream(_this.key, _this.options.params);
      _this.uploadStream = new UploadStream(_this.account, _this.hash, _this.uploadSize, _this.options.endpoint, _this.options.params);

      _this.uploadStream.on("progress", progress => {
        _this.emit("upload-progress", {
          target: _this,
          handle: _this.handle,
          progress
        });
      });

      _this.readStream.pipe(_this.encryptStream).pipe(_this.uploadStream).on("finish", _this.finishUpload);

      _this.readStream.on("error", _this.propagateError);

      _this.encryptStream.on("error", _this.propagateError);

      _this.uploadStream.on("error", _this.propagateError);
    });
    this.finishUpload =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      _this.emit("finish", {
        target: _this,
        handle: _this.handle,
        metadata: _this.metadata
      });
    });

    this.propagateError = error => {
      process.nextTick(() => this.emit("error", error));
    };

    const options = Object.assign({}, DEFAULT_OPTIONS$7, opts);
    options.params = Object.assign({}, DEFAULT_FILE_PARAMS, options.params || {});

    const _generateFileKeys = generateFileKeys(),
          handle = _generateFileKeys.handle,
          hash = _generateFileKeys.hash,
          key = _generateFileKeys.key;

    const data = getFileData(file, handle);
    const size = getUploadSize(file.size, options.params);
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

const hash = (...val) => {
  return web3Utils.soliditySha3(...val).replace(/^0x/, "");
};

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
    this.type = "file";
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
   * @param location - // DEPRECATED location on the network of the file
   * @param handle - the file handle
   * @param hash - a hash of the file
   *   NOTE: probably `sha1`
   * @param modified - the date in `ms` that this version of the file was originally changed
   */
  constructor({
    size,
    // location,
    handle,
    hash,
    modified = Date.now()
  }) {
    this.size = size; // this.location = location

    this.handle = handle;
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
    this.type = "folder";
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
    name = "Folder",
    files = [],
    created = Date.now(),
    hidden = false,
    locked = false,
    tags = []
  } = {}) {
    this.name = name;
    this.files = files;
    this.created = created;
    this.hidden = hidden;
    this.locked = locked;
    this.tags = tags;
  }

}

/**
 * **_this should never be shared or left in storage_**
 *
 * a class for representing the account mnemonic
 */

class Account {
  get mnemonic() {
    return this._mnemonic.trim().split(/\s+/g);
  }
  /**
   * creates an account from a mnemonic if provided, otherwise from entropy
   *
   * @param mnemonic - the mnemonic to use for the account
   */


  constructor(mnemonic = bip39.generateMnemonic()) {
    if (!bip39.validateMnemonic(mnemonic)) throw new Error("mnemonic provided was not valid");
    this._mnemonic = mnemonic;
  }

  get seed() {
    return bip39.mnemonicToSeedSync(this._mnemonic);
  }

}
/**
 * **_this should never be shared or left in storage_**
 *
 * a class for creating a master handle from an account mnemonic
 *
 * a master handle is responsible for:
 *  - logging in to an account
 *  - signing changes for the account
 *  - deterministic entropy for generating features of an account (such as file keys)
 */


class MasterHandle extends HDKey__default {
  /**
   * creates a master handle from an account
   *
   * @param account - the account to generate the handle from
   */
  constructor({
    account,
    handle
  }, {
    uploadOpts = {},
    downloadOpts = {}
  } = {}) {
    var _this;

    super();
    _this = this;

    /**
     * creates a sub key seed for validating
     *
     * @param path - the string to use as a sub path
     */
    this.generateSubHDKey = pathString => {
      const path = MasterHandle.hashToPath(hash(pathString), {
        prefix: true
      });
      return this.derive(path);
    };

    this.uploadFile = (dir, file) => {
      const upload = new Upload(file, this, this.uploadOpts),
            ee = new events.EventEmitter();
      Object.assign(ee, {
        handle: upload.handle
      });
      upload.on("upload-progress", progress => {
        ee.emit("upload-progress", progress);
      });
      upload.on("error", err => {
        ee.emit("error", err);
        throw err;
      });
      upload.on("finish",
      /*#__PURE__*/
      function () {
        var _ref = _asyncToGenerator(function* (finishedUpload) {
          const folderMeta = yield _this.getFolderMetadata(dir),
                oldMetaIndex = folderMeta.files.findIndex(e => e.name == file.name && e.type == "file"),
                oldMeta = oldMetaIndex !== -1 ? folderMeta.files[oldMetaIndex] : {},
                version = new FileVersion({
            size: file.size,
            handle: finishedUpload.handle,
            modified: file.lastModified
          }),
                meta = new FileEntryMeta({
            name: file.name,
            created: oldMeta.created,
            versions: [version, ...(oldMeta.versions || [])]
          }); // metadata existed previously

          if (oldMetaIndex !== -1) folderMeta.files.splice(oldMetaIndex, 1, meta);else folderMeta.files.unshift(meta);
          const buf = Buffer.from(JSON.stringify(folderMeta));

          const metaUpload = _this.uploadFolderMeta(dir, folderMeta);

          metaUpload.on("error", err => {
            ee.emit("error", err);
            throw err;
          });
          metaUpload.on("finish", finishedMeta => {
            ee.emit("finish", finishedUpload);
          });
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
      return ee;
    };

    this.downloadFile = handle => {
      return new Download(handle, this.downloadOpts);
    };
    /**
     * creates a file key seed for validating
     *
     * @param file - the location of the file on the network
     */


    this.getFileHDKey = file => {
      return this.generateSubHDKey("file: " + file);
    };
    /**
     * creates a dir key seed for validating and folder navigation
     *
     * @param dir - the folder path in the UI
     */


    this.getFolderHDKey = dir => {
      return this.generateSubHDKey("folder: " + dir);
    };

    this.getFolderLocation = dir => {
      return hash(this.getFolderHDKey(dir).publicKey.toString("hex"));
    };

    this.getFolderHandle =
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(function* (dir) {
        const folderKey = _this.getFolderHDKey(dir),
              location = _this.getFolderLocation(dir),
              key = hash(folderKey.privateKey.toString("hex")),
              response = yield getMetadata(_this.uploadOpts.endpoint, folderKey, location); // TODO
        // I have no idea why but the decrypted is correct hex without converting


        const metaLocation = decrypt(key, new nodeForge.util.ByteBuffer(Buffer.from(response.data.metadata, "hex"))).toString();
        return metaLocation + MasterHandle.getKey(_this, metaLocation);
      });

      return function (_x2) {
        return _ref2.apply(this, arguments);
      };
    }();

    this.uploadFolderMeta = (dir, folderMeta) => {
      const ee = new events.EventEmitter();
      const file = new File([Buffer.from(JSON.stringify(folderMeta))], "metadata_" + dir);
      const folderKey = this.getFolderHDKey(dir);
      const metaUpload = new Upload(file, this, this.uploadOpts);
      metaUpload.on("error", err => {
        ee.emit("error", err);
        throw err;
      });
      metaUpload.on("finish",
      /*#__PURE__*/
      function () {
        var _ref3 = _asyncToGenerator(function* (finishedMeta) {
          const encryptedHandle = encryptString(hash(folderKey.privateKey.toString("hex")), finishedMeta.handle).toHex(); // TODO

          yield setMetadata(_this.uploadOpts.endpoint, _this.getFolderHDKey(dir), _this.getFolderLocation(dir), encryptedHandle);
          ee.emit("finish", finishedMeta);
        });

        return function (_x3) {
          return _ref3.apply(this, arguments);
        };
      }());
      return ee;
    };

    this.getFolderMetadata =
    /*#__PURE__*/
    function () {
      var _ref4 = _asyncToGenerator(function* (dir) {
        let handle;

        try {
          handle = yield _this.getFolderHandle(dir);
        } catch (err) {
          console.warn(err);
          return new FolderMeta();
        }

        const download = new Download(handle, Object.assign({}, _this.downloadOpts, {
          autoStart: true
        }));
        download.on("error", console.error);
        const reader = new FileReader();
        reader.readAsBinaryString((yield download.toFile()));
        yield new Promise(resolve => {
          reader.onloadend = resolve;
        });
        const meta = JSON.parse(reader.result);
        return meta;
      });

      return function (_x4) {
        return _ref4.apply(this, arguments);
      };
    }();

    this.isPaid =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      try {
        const accountInfoResponse = yield checkPaymentStatus(_this.uploadOpts.endpoint, _this);
        return accountInfoResponse.data.paymentStatus == "paid";
      } catch (_a) {
        return false;
      }
    });
    this.register =
    /*#__PURE__*/
    _asyncToGenerator(function* () {
      if (yield _this.isPaid()) return Promise.resolve({
        data: {
          invoice: {
            cost: 0,
            ethAddress: "0x0"
          }
        },
        waitForPayment: function () {
          var _waitForPayment = _asyncToGenerator(function* () {
            return {
              data: (yield checkPaymentStatus(_this.uploadOpts.endpoint, _this)).data
            };
          });

          function waitForPayment() {
            return _waitForPayment.apply(this, arguments);
          }

          return waitForPayment;
        }()
      });
      const createAccountResponse = yield createAccount(_this.uploadOpts.endpoint, _this, _this.getFolderLocation("/"));
      return new Promise(resolve => {
        resolve({
          data: createAccountResponse.data,
          waitForPayment: () => new Promise(resolve => {
            const interval = setInterval(
            /*#__PURE__*/
            _asyncToGenerator(function* () {
              if (yield _this.isPaid()) {
                clearInterval(interval);
                resolve({
                  data: (yield checkPaymentStatus(_this.uploadOpts.endpoint, _this)).data
                });
              }
            }), 10 * 1000);
          })
        });
      });
    });
    this.uploadOpts = uploadOpts;
    this.downloadOpts = downloadOpts;

    if (account && account.constructor == Account) {
      const path = "m/43'/60'/1775'/0'/" + MasterHandle.hashToPath(namehash.hash("opacity.io").replace(/^0x/, "")); // TODO: fill in path
      // ethereum/EIPs#1775 is very close to ready, it would be better to use it instead

      Object.assign(this, HDKey.fromMasterSeed(account.seed).derive(path));
    } else if (handle && handle.constructor == String) {
      this.privateKey = Buffer.from(handle, "hex");
    } else {
      throw new Error("master handle was not of expected type");
    }
  }

  static getKey(from, str) {
    return hash(from.privateKey.toString("hex"), str);
  }

}

MasterHandle.hashToPath = (h, {
  prefix = false
} = {}) => {
  if (h.length % 4) throw new Error("hash length must be multiple of two bytes");
  return (prefix ? "m/" : "") + h.match(/.{1,4}/g).map(p => parseInt(p, 16)).join("'/") + "'";
};

exports.HDKey = HDKey__default;
exports.Account = Account;
exports.AccountMeta = AccountMeta;
exports.AccountPreferences = AccountPreferences;
exports.Download = Download;
exports.FileEntryMeta = FileEntryMeta;
exports.FileVersion = FileVersion;
exports.FolderEntryMeta = FolderEntryMeta;
exports.FolderMeta = FolderMeta;
exports.MasterHandle = MasterHandle;
exports.Upload = Upload;
exports.checkPaymentStatus = checkPaymentStatus;
exports.createAccount = createAccount;
exports.getMetadata = getMetadata;
exports.getPayload = getPayload;
exports.getPayloadFD = getPayloadFD;
exports.setMetadata = setMetadata;
