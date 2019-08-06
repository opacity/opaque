import Axios from "axios";
import { EventEmitter } from "events";
import { createMetadata, encryptMetadata, FileMeta, FileMetaOptions } from "./core/metadata";
import {
  generateFileKeys,
  getUploadSize,
  getFileData,
  getEndIndex,
  FileData
} from "./core/helpers";
import FormDataNode from "form-data";
import EncryptStream from "./streams/encryptStream";
import UploadStream from "./streams/uploadStream";
import { Readable } from "readable-stream";
import { getPayloadFD } from "./core/request";
import HDKey from "hdkey";

const PART_MIN_SIZE = 1024 * 1024 * 5;
const POLYFILL_FORMDATA = typeof FormData === "undefined";

type UploadOptions = {
  autoStart?: boolean,
  endpoint?: boolean,
  params?: FileMetaOptions
}
const DEFAULT_OPTIONS: UploadOptions = Object.freeze({
  autoStart: true
});
const DEFAULT_FILE_PARAMS = {
  blockSize: 64 * 1024, // 64 KiB encryption blocks
}

/**
 * @internal
 */
export default class Upload extends EventEmitter {
  account: HDKey
  options: UploadOptions
  data: FileData
  uploadSize
  key: string
  hash: string
  handle: string
  metadata: FileMeta
  readStream: Readable
  encryptStream: EncryptStream
  uploadStream: UploadStream

  constructor(file, account, opts: UploadOptions = {}) {
    super();

    const options = Object.assign({}, DEFAULT_OPTIONS, opts);
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
      this.startUpload()
    }
  }

  startUpload = async () => {
    try {
      await this.uploadMetadata();
      await this.uploadFile();
    } catch(e) {
      this.propagateError(e);
    }
  }

  uploadMetadata = async () => {
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
    const headers = (data as FormDataNode).getHeaders ? (data as FormDataNode).getHeaders() : {};
    const req = Axios.post(url, data, { headers });
    const res = await req;

    this.emit("metadata", meta);
  }

  uploadFile = async () => {
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
  }

  finishUpload = async () => {
    this.emit("finish", {
      target: this,
      handle: this.handle,
      metadata: this.metadata
    });
  }

  propagateError = (error) => {
    process.nextTick(() => this.emit("error", error));
  }
}
