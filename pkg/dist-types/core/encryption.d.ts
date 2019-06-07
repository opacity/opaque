import { util as ForgeUtil, Encoding } from "node-forge";
export declare function encrypt(key: any, byteBuffer: ForgeUtil.ByteBuffer): ForgeUtil.ByteStringBuffer;
export declare function encryptString(key: string, string: string, encoding?: Encoding): ForgeUtil.ByteStringBuffer;
export declare function encryptBytes(key: any, bytes: any): ForgeUtil.ByteStringBuffer;
export declare function decrypt(key: string, byteBuffer: ForgeUtil.ByteBuffer): false | ForgeUtil.ByteStringBuffer;
export declare function decryptBytes(key: any, bytes: any): false | Uint8Array;
export declare function decryptString(key: string, byteBuffer: ForgeUtil.ByteBuffer, encoding?: string): string;
