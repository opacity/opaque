import { util as ForgeUtil } from "node-forge";
import { Readable } from "readable-stream";
import { Buffer } from "safe-buffer";
export declare function generateFileKeys(): {
    hash: string;
    key: ForgeUtil.ByteStringBuffer;
    handle: string;
};
export declare function keysFromHandle(handle: any): {
    hash: string;
    key: ForgeUtil.ByteStringBuffer;
    handle: any;
};
export declare function sanitizeFilename(filename: string): string;
export declare type FileData = {
    data: Buffer;
    size: number;
    name: string;
    type: string;
    reader: Readable;
};
export declare function getFileData(file: Buffer | FileData, nameFallback?: string): FileData;
export declare function getUploadSize(size: any, params: any): any;
export declare function getEndIndex(uploadSize: any, params: any): number;
