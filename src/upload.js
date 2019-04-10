import Axios from "axios";
import { pipeline } from "readable-stream";
import { EventEmitter } from "events";
import { createMetadata, encryptMetadata } from "./core/metadata";
import {
  generateFileKeys,
  getUploadSize,
  getFileData
} from "./core/helpers";
import { UPLOAD_EVENTS as EVENTS } from "./core/constants";
import FormData from "form-data";
import EncryptStream from "./streams/encryptStream";
import UploadStream from "./streams/uploadStream";

const PART_MIN_SIZE = 1024 * 1024 * 5;
const DEFAULT_OPTIONS = Object.freeze({
  autoStart: true
});
const DEFAULT_FILE_PARAMS = {
  blockSize: 64 * 1024, // 64 KiB encryption blocks
}

export default class Upload extends EventEmitter {
  constructor(file, account, opts) {
    const options = Object.assign({}, DEFAULT_OPTIONS, opts || {});
    options.params = Object.assign({}, DEFAULT_FILE_PARAMS, options.params || {});

    const { handle, hash, key } = generateFileKeys();
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
      this.startUpload()
    }
  }

  async startUpload(session) {
    try {
      await this.uploadMetadata();
      await this.uploadFile();
    } catch(e) {
      this.propagateError(e);
    }
  }

  async uploadMetadata() {
    const meta = createMetadata(this.data, this.options.params);
    const encryptedMeta = encryptMetadata(meta, this.key);
    const data = new FormData();

    // TODO: Actual account
    data.append("account", this.account);
    // TODO: Use separate metadata hash
    data.append("hash", this.hash);
    // Just used to prematurely return an error if not enough space
    data.append("size", this.uploadSize);
    data.append("metadata", Buffer.from(encryptedMeta.buffer), {
      filename: 'metadata',
      contentType: "application/octet-stream",
      knownLength: encryptedMeta.length
    });

    return Axios.put(this.options.endpoint + "/upload/metadata", data, {
      headers: data.getHeaders()
    })
    .then(res => {
      this.emit("metadata", )
    })
    .catch(err => {
      console.log("METADATA ERROR", err.message || err);
    })
  }

  async uploadFile() {
    const readStream = new this.data.reader(this.data, this.options.params);

    this.readStream = readStream;
    this.encryptStream = new EncryptStream(this.key, this.options.params);
    this.uploadStream = new UploadStream(this.account, this.hash, this.uploadSize, this.options.endpoint, this.options.params);

    this.uploadStream.on("progress", this.uploadProgress);

    pipeline(
      this.readStream,
      this.encryptStream,
      this.uploadStream,
      this.finishUpload
    )
  }

  // TODO: Proper progress logic
  async uploadProgress(event) {
    this.emit("progress", event);
  }

  async finishUpload(error) {
    if(error) {
      return;
    }

    this.emit("upload-finished", { target: this, handle: this.handle });
    this.emit("finish");
  }


  propagateError(error) {
    process.nextTick(() => this.emit("error", error));
  }
}
