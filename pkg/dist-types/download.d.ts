/// <reference types="node" />
import { EventEmitter } from "events";
import { FileMeta } from "./core/metadata";
/**
 * Downloading files
 */
export default class Download extends EventEmitter {
    options: any;
    handle: any;
    hash: any;
    key: any;
    metadataRequest: any;
    downloadURL: string;
    isDownloading: boolean;
    decryptStream: any;
    downloadStream: any;
    _metadata: FileMeta;
    size: any;
    constructor(handle: any, opts: any);
    readonly metadata: Promise<FileMeta>;
    toBuffer(): Promise<{}>;
    toFile(): Promise<{}>;
    startDownload(): Promise<void>;
    getDownloadURL(): Promise<string>;
    downloadMetadata(overwrite?: boolean): Promise<FileMeta>;
    downloadFile(): Promise<boolean>;
    finishDownload(error: any): void;
    propagateError(error: any): void;
}
