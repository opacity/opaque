import { FileData } from "./helpers";
declare type FileMetaOpts = {
    blockSize: number;
    chunkSize: number;
};
export declare type FileMeta = {
    name: string;
    type: string;
    size: number;
    p: FileMetaOpts;
};
export declare function createMetadata(file: FileData, opts: FileMetaOpts): FileMeta;
export declare function encryptMetadata(metadata: FileMeta, key: string): Uint8Array;
export declare function decryptMetadata(data: Uint8Array, key: string): FileMeta;
export {};
