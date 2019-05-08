import { Readable } from "readable-stream";
export default class DownloadStream extends Readable {
    options: any;
    hash: any;
    size: any;
    metadata: any;
    numChunks: any;
    chunks: any;
    chunkId: any;
    pushId: any;
    bytesDownloaded: any;
    isDownloadFinished: any;
    ongoingDownloads: any;
    pushChunk: any;
    constructor(hash: any, metadata: any, size: any, options: any);
    _read(): void;
    _download(chunkIndex?: any): Promise<void>;
    _afterDownload(): Promise<void>;
    _pushChunk(): void;
}
