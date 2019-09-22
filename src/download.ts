import Axios from "axios";
import { EventEmitter } from "events";
import { pipeline } from "readable-stream";
import { decryptMetadata } from "./core/metadata";
import { getPayload } from "./core/request";
import {
  getMimeType,
  getUploadSize,
  keysFromHandle
} from "./core/helpers";

import { FileMeta } from "./core/metadata"

import DecryptStream from "./streams/decryptStream";
import DownloadStream from "./streams/downloadStream";

const METADATA_PATH = "/download/metadata/";

type DownloadOptions = {
  autoStart?: boolean
  endpoint?: string
}

const DEFAULT_OPTIONS: DownloadOptions = Object.freeze({
  autoStart: true
});

/**
 * @internal
 */
export default class Download extends EventEmitter {
  options: DownloadOptions
  handle: string
  hash: string
  key: string
  downloadURLRequest
  metadataRequest
  downloadURL: string
  isDownloading: boolean
  decryptStream: DecryptStream
  downloadStream: DownloadStream
  _metadata: FileMeta

  private size

  constructor(handle, opts: DownloadOptions = {}) {
    super();

    const options = Object.assign({}, DEFAULT_OPTIONS, opts);
    const { hash, key } = keysFromHandle(handle);

    this.options = options;
    this.handle = handle;
    this.hash = hash;
    this.key = key;
    this.downloadURLRequest = null;
    this.metadataRequest = null;
    this.isDownloading = false;

    if(options.autoStart) {
      this.startDownload();
    }
  }

  metadata = async () => {
    if(this._metadata) {
      return this._metadata;
    } else {
      return await this.downloadMetadata();
    }
  }

  toBuffer = async () => {
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
      });

      this.decryptStream.once("finish", () => {
        resolve(Buffer.concat(chunks, totalLength));
      });
    }).catch(err => {
      throw err;
    });
  }

  toFile = async () => {
    const chunks = [] as BlobPart[];
    let totalLength = 0;

    await this.startDownload();

    return new Promise(resolve => {
      this.decryptStream.on("data", (data) => {
        chunks.push(data);
        totalLength += data.length;
      })

      this.decryptStream.once("finish", async () => {
        const meta = await this.metadata();
        resolve(new File(chunks, meta.name, {
          type: getMimeType(meta)
        }));
      })
    }).catch(err => {
      throw err;
    })
  }

  startDownload = async () => {
    try {
      await this.getDownloadURL();
      await this.downloadMetadata();
      await this.downloadFile();
    } catch(e) {
      this.propagateError(e);
    }
  }

  getDownloadURL = async (overwrite = false) => {
    let req;

    if(!overwrite && this.downloadURLRequest) {
      req = this.downloadURLRequest;
    } else {
      req = Axios.post(this.options.endpoint + "/api/v1/download", {
        fileID: this.hash
      });
      this.downloadURLRequest = req;
    }

    const res = await req;

    if(res.status === 200) {
      this.downloadURL = res.data.fileDownloadUrl;
      return this.downloadURL;
    }
  }

  downloadMetadata = async (overwrite = false) => {
    let req;

    if(!this.downloadURL) {
      await this.getDownloadURL();
    }

    if(!overwrite && this.metadataRequest) {
      req = this.metadataRequest;
    } else {
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
  }

  downloadFile = async () => {
    if(this.isDownloading) {
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
      })
    });

    this.downloadStream
      .pipe(this.decryptStream)

    this.downloadStream.on("error", this.propagateError);
    this.decryptStream.on("error", this.propagateError);
  }

  finishDownload = (error) => {
    if(error) {
      this.propagateError(error);
    } else {
      this.emit("finish");
    }
  }

  propagateError = (error) => {
    console.warn("Download error: ", error.message || error);
    process.nextTick(() => this.emit("error", error.message || error));
  }
}
