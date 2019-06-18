import FormDataNode from "form-data";
import HDKey from "hdkey";
export declare function getPayload(rawPayload: any, hdNode: HDKey, key?: string): {
    signature: string;
    publicKey: string;
    hash: string;
};
export declare function getPayloadFD(rawPayload: {
    [key: string]: any;
}, extraPayload: any, hdNode: HDKey, key?: string): FormDataNode | FormData;
export { getPlans } from "./requests/getPlans";
export { checkPaymentStatus } from "./requests/checkPaymentStatus";
export { createAccount } from "./requests/createAccount";
export { getMetadata, setMetadata } from "./requests/metadata";
