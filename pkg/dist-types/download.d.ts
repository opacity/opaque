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
 * @internal
 */
export default class Download extends EventEmitter {
    options: DownloadOptions;
    handle: string;
    hash: string;
    key: string;
    downloadURLRequest: any;
    metadataRequest: any;
    downloadURL: string;
    isDownloading: boolean;
    decryptStream: DecryptStream;
    downloadStream: DownloadStream;
    _metadata: FileMeta;
    private size;
    constructor(handle: any, opts?: DownloadOptions);
    metadata: () => Promise<FileMeta>;
    toBuffer: () => Promise<unknown>;
    toFile: () => Promise<unknown>;
    startDownload: () => Promise<void>;
    getDownloadURL: (overwrite?: boolean) => Promise<string>;
    downloadMetadata: (overwrite?: boolean) => Promise<FileMeta>;
    downloadFile: () => Promise<boolean>;
    finishDownload: (error: any) => void;
    propagateError: (error: any) => void;
}
export {};
