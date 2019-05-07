import { util as ForgeUtil } from "node-forge";
export declare function encrypt(key: any, byteBuffer: any): any;
export declare function encryptString(key: any, string: any, encoding: any): any;
export declare function encryptBytes(key: any, bytes: any): any;
export declare function decrypt(key: any, byteBuffer: any): false | ForgeUtil.ByteStringBuffer;
export declare function decryptBytes(key: any, bytes: any): false | Uint8Array;
export declare function decryptString(key: string, byteBuffer: any, encoding?: string): string;