import FormDataNode from "form-data";
import HDKey from "hdkey";
/**
 * get a signed payload from an hdkey
 *
 * @param rawPayload - a payload object to be processed and signed
 * @param hdNode = the account to sign with
 * @param key
 *
 * @internal
 */
export declare function getPayload(rawPayload: any, hdNode: HDKey, key?: string): {
    signature: string;
    publicKey: string;
    hash: string;
};
/**
 * get a signed formdata payload from an hdkey
 *
 * @param rawPayload - a payload object to be processed and signed
 * @param extraPayload - additional (unsigned) payload information
 * @param hdNode - the account to sign with
 * @param key
 *
 * @internal
 */
export declare function getPayloadFD(rawPayload: {
    [key: string]: any;
}, extraPayload: any, hdNode: HDKey, key?: string): FormDataNode | FormData;
export { getPlans } from "./requests/getPlans";
export { checkPaymentStatus } from "./requests/checkPaymentStatus";
export { createAccount } from "./requests/createAccount";
export { getMetadata, setMetadata, createMetadata, deleteMetadata } from "./requests/metadata";
