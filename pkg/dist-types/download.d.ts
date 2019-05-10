/// <reference types="node" />
import { EventEmitter } from "events";
import { FileMeta } from "./core/metadata";
import DecryptStream from "./streams/decryptStream";
import DownloadStream from "./streams/downloadStream";
declare type DownloadOptions = {
    autoStart?: boolean;
    endpoint?: string;
};
/**
 * Downloading files
 */
export default class Download extends EventEmitter {
    options: DownloadOptions;
    handle: string;
    hash: string;
    key: string;
    metadataRequest: any;
    isDownloading: boolean;
    decryptStream: DecryptStream;
    downloadStream: DownloadStream;
    _metadata: FileMeta;
    private size;
    constructor(handle: any, opts?: DownloadOptions);
    readonly metadata: Promise<FileMeta>;
    toBuffer: () => Promise<{}>;
    toFile: () => Promise<{}>;
    startDownload: () => Promise<void>;
    downloadMetadata: (overwrite?: boolean) => Promise<FileMeta>;
    downloadFile: () => Promise<boolean>;
    finishDownload: (error: any) => void;
    propagateError: (error: any) => void;
}
export {};
