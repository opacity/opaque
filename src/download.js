import Axios from "axios";
import { EventEmitter } from "events";
import { pipeline } from "readable-stream";
import { decryptMetadata } from "./core/metadata";
import {
  getUploadSize,
  keysFromHandle
} from "./core/helpers";

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

  async metadata() {
    if(this.metadata) {
      return this.metadata;
    } else {
      return await this.downloadMetadata();
    }
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
    this.metadata = metadata;
    this.size = getUploadSize(metadata.size, metadata.p || {});

    return metadata;
  }

  async downloadFile() {
    if(this.isDownloading) {
      return true;
    }

    this.isDownloading = true;
    this.downloadStream = new DownloadStream(this.hash, this.metadata, this.size, {
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

    pipeline(
      this.downloadStream,
      this.decryptStream,
      this.finishDownload
    );
  }

  finishDownload(error) {
    if(error) {
      this.propagateError(error);
    } else {
      this.emit("finish");
    }
  }

  propagateError(error) {
    this.emit("error", error);
  }
}