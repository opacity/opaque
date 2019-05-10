/// <reference types="node" />
import { EventEmitter } from "events";
import { FileMeta } from "./core/metadata";
import { FileData } from "./core/helpers";
import { Readable } from "readable-stream";
export default class Upload extends EventEmitter {
    account: string;
    options: any;
    data: FileData;
    uploadSize: any;
    key: string;
    hash: string;
    handle: string;
    metadata: FileMeta;
    readStream: Readable;
    encryptStream: any;
    uploadStream: any;
    constructor(file: any, account: any, opts: any);
    startUpload: () => Promise<void>;
    uploadMetadata: () => Promise<void>;
    uploadFile: () => Promise<void>;
    finishUpload(): Promise<void>;
    propagateError: (error: any) => void;
}
