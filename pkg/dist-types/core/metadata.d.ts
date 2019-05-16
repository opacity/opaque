import { FileData } from "./helpers";
export declare type FileMetaOptions = {
    blockSize?: number;
    chunkSize?: number;
};
export declare type FileMeta = {
    name: string;
    type: string;
    size: number;
    p: FileMetaOptions;
};
export declare function createMetadata(file: FileData, opts: FileMetaOptions): FileMeta;
export declare function encryptMetadata(metadata: FileMeta, key: string): Uint8Array;
export declare function decryptMetadata(data: Uint8Array, key: string): FileMeta;
