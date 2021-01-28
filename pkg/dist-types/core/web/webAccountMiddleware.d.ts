/// <reference types="node" />
import { CryptoMiddleware } from "../../middleware";
export declare type WebAccountMiddlewareArgs = {
    asymmetricKey?: Uint8Array;
    symmetricKey?: Uint8Array;
};
export declare class WebAccountMiddleware implements CryptoMiddleware {
    asymmetricKey: Uint8Array;
    symmetricKey: Uint8Array;
    constructor({ symmetricKey, asymmetricKey }?: WebAccountMiddlewareArgs);
    getPublicKey(k?: Uint8Array): Promise<Buffer>;
    derive(k: Uint8Array, p: string): Promise<Uint8Array>;
    sign(k: Uint8Array, d: Uint8Array): Promise<Buffer>;
    encrypt(k: Uint8Array, d: Uint8Array): Promise<Uint8Array>;
    decrypt(k: Uint8Array, ct: Uint8Array): Promise<Uint8Array>;
}
