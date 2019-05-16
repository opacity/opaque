import HDKey from "hdkey";
export declare function getPayload(rawPayload: any, hdNode: HDKey, key?: string): {
    signature: any;
    publicKey: any;
    hash: string;
};
export declare function getPayloadFD(rawPayload: {
    [key: string]: any;
}, extraPayload: any, hdNode: HDKey, key?: string): any;
export { checkPaymentStatus } from "./requests/checkPaymentStatus";
export { createAccount } from "./requests/createAccount";
export { getMetadata, setMetadata } from "./requests/metadata";
