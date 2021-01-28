import { CryptoMiddleware } from "../middleware";
export declare const serializeEncrypted: <T>(crypto: CryptoMiddleware, bytes: Uint8Array, key: Uint8Array) => Promise<T>;
