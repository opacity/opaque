import FileSourceStream from "../streams/fileSourceStream";
import BufferSourceStream from "../streams/bufferSourceStream";
import { Readable } from "readable-stream";
import { Buffer } from "safe-buffer";
export declare function generateFileKeys(): {
    hash: string;
    key: string;
    handle: string;
};
export declare function keysFromHandle(handle: string): {
    hash: string;
    key: string;
    handle: string;
};
export declare function sanitizeFilename(filename: string): string;
export declare type FileData = {
    data: Buffer;
    size: number;
    name: string;
    type: string;
    reader: typeof Readable | typeof BufferSourceStream | typeof FileSourceStream;
};
export declare function getFileData(file: Buffer | FileData, nameFallback?: string): FileData;
export declare function getUploadSize(size: number, params: {
    blockSize?: number;
}): number;
