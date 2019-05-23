/// <reference types="node" />
import { Writable } from "readable-stream";
export default class UploadStream extends Writable {
    account: any;
    hash: Buffer;
    endpoint: any;
    options: any;
    size: number;
    endIndex: number;
    private bytesUploaded;
    private blockBuffer;
    private partBuffer;
    private bufferSize;
    private ongoingUploads;
    private retries;
    private partIndex;
    private finalCallback;
    constructor(account: any, hash: any, size: any, endpoint: any, options: any);
    _write(data: any, encoding: any, callback: any): void;
    _final(callback: any): void;
    _addPart(): void;
    _attemptUpload(): void;
    _upload(part: any): void;
    _afterUpload(part: any): void;
    _finishUpload(): Promise<void>;
    _confirmUpload(data: any): Promise<boolean>;
    _uploadError(error: any, part: any): void;
}
