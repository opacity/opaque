import { Readable } from "readable-stream";
export default class DownloadStream extends Readable {
    options: any;
    url: any;
    size: any;
    metadata: any;
    chunks: any;
    chunkId: any;
    pushId: any;
    bytesDownloaded: any;
    isDownloadFinished: any;
    ongoingDownloads: any;
    pushChunk: any;
    constructor(url: any, metadata: any, size: any, options?: {});
    _read(): void;
    _download(chunkIndex?: any): Promise<void>;
    _afterDownload(): Promise<void>;
    _pushChunk(): void;
}
