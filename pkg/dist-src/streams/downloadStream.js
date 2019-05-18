import Axios from "axios";
import { Readable } from "readable-stream";
import { getBlockSize } from "../core/helpers";
import { DEFAULT_BLOCK_SIZE, BLOCK_OVERHEAD } from "../core/constants";
const DEFAULT_OPTIONS = Object.freeze({
    autostart: true,
    maxParallelDownloads: 1,
    maxRetries: 0,
    partSize: 80 * (DEFAULT_BLOCK_SIZE + BLOCK_OVERHEAD),
    objectMode: false
});
export default class DownloadStream extends Readable {
    constructor(url, metadata, size, options = {}) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options);
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
