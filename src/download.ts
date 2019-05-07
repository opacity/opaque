import Axios from "axios";
import { EventEmitter } from "events";
import { pipeline } from "readable-stream";
import { decryptMetadata } from "./core/metadata";
import {
  getUploadSize,
  keysFromHandle
} from "./core/helpers";

import { FileMeta } from "./core/metadata"

import DecryptStream from "./streams/decryptStream";
import DownloadStream from "./streams/downloadStream";

const METADATA_PATH = "/download/metadata/";
const DEFAULT_OPTIONS = Object.freeze({
  autoStart: true
});

/**
 * Downloading files
 */
export default class Download extends EventEmitter {
  options
  handle
  hash
  key
  metadataRequest
  isDownloading: boolean
  decryptStream
  downloadStream
  _metadata: FileMeta
  size

  constructor(handle, opts) {
    const options = Object.assign({}, DEFAULT_OPTIONS, opts);
    const { hash, key } = keysFromHandle(handle);

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

    if(options.autoStart) {
      this.startDownload();
    }
  }

  get metadata (): Promise<FileMeta> {
    return new Promise(async resolve => {
      if(this._metadata) {
        resolve(this._metadata);
      } else {
        resolve(await this.downloadMetadata());
      }
    })
  }

  async toBuffer() {
    const chunks = [];
    let totalLength = 0;

    if(typeof Buffer === "undefined") {
      return false;
    }

    await this.startDownload();

    return new Promise(resolve => {
      this.decryptStream.on("data", (data) => {
        chunks.push(data);
        totalLength += data.length;
      })

      this.decryptStream.once("finish", () => {
        resolve(Buffer.concat(chunks, totalLength));
      })
    });
  }

  async toFile() {
    const chunks = [] as BlobPart[];
    let totalLength = 0;

    await this.startDownload();

    return new Promise(resolve => {
      this.decryptStream.on("data", (data) => {
        chunks.push(data);
        totalLength += data.length;
      })

      this.decryptStream.once("finish", async () => {
        resolve(new File(chunks, (await this.metadata).name, {
          type: "text/plain"
        }));
      })
    });
  }

  async startDownload() {
    try {
      await this.downloadMetadata();
      await this.downloadFile();
    } catch(e) {
      this.propagateError(e);
    }
  }

  async downloadMetadata(overwrite = false) {
    let req;

    if(!overwrite && this.metadataRequest) {
      req = this.metadataRequest;
    } else {
      const endpoint = this.options.endpoint;
      const path = METADATA_PATH + this.hash;
      req = this.metadataRequest = Axios.get(endpoint + path, {
        responseType: "arraybuffer"
      });
    }


    const res = await req;
    const metadata = decryptMetadata(res.data, this.key);
    this._metadata = metadata;
    this.size = getUploadSize(metadata.size, metadata.p || {});

    return metadata;
  }

  async downloadFile() {
    if(this.isDownloading) {
      return true;
    }

    this.isDownloading = true;
    this.downloadStream = new DownloadStream(this.hash, await this.metadata, this.size, {
      endpoint: this.options.endpoint
    });
    this.decryptStream = new DecryptStream(this.key);
    // this.targetStream = new targetStream(this.metadata);

    this.downloadStream.on("progress", progress => {
      this.emit("download-progress", {
        target: this,
        handle: this.handle,
        progress: progress
      })
    });

    this.downloadStream
      .pipe(this.decryptStream)

    this.downloadStream.on("error", this.propagateError);
    this.decryptStream.on("error", this.propagateError);
  }

  finishDownload(error) {
    if(error) {
      this.propagateError(error);
    } else {
      this.emit("finish");
    }
  }

  propagateError(error) {
    process.nextTick(() => this.emit("error", error));
  }
}
