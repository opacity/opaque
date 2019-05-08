/// <reference types="node" />
import { EventEmitter } from "events";
export default class Upload extends EventEmitter {
    account: any;
    options: any;
    data: any;
    uploadSize: any;
    key: any;
    hash: any;
    handle: any;
    metadata: any;
    readStream: any;
    encryptStream: any;
    uploadStream: any;
    constructor(file: any, account: any, opts: any);
    startUpload(): Promise<void>;
    uploadMetadata(): Promise<void>;
    uploadFile(): Promise<void>;
    finishUpload(): Promise<void>;
    propagateError(error: any): void;
}
