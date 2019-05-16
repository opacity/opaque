/// <reference types="node" />
import { EventEmitter } from "events";
import { FileMeta, FileMetaOptions } from "./core/metadata";
import { FileData } from "./core/helpers";
import EncryptStream from "./streams/encryptStream";
import UploadStream from "./streams/uploadStream";
import { Readable } from "readable-stream";
declare type UploadOptions = {
    autoStart?: boolean;
    endpoint?: boolean;
    params?: FileMetaOptions;
};
export default class Upload extends EventEmitter {
    account: string;
    options: UploadOptions;
    data: FileData;
    uploadSize: any;
    key: string;
    hash: string;
    handle: string;
    metadata: FileMeta;
    readStream: Readable;
    encryptStream: EncryptStream;
    uploadStream: UploadStream;
    constructor(file: any, account: any, opts?: UploadOptions);
    startUpload: () => Promise<void>;
    uploadMetadata: () => Promise<void>;
    uploadFile: () => Promise<void>;
    finishUpload(): Promise<void>;
    propagateError: (error: any) => void;
}
export {};
