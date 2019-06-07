import FormDataNode from "form-data";
import * as EthUtil from "ethereumjs-util";
const POLYFILL_FORMDATA = typeof FormData === "undefined";
export function getPayload(rawPayload, hdNode, key = "requestBody") {
    const payload = JSON.stringify(rawPayload);
    const hash = EthUtil.keccak256(payload);
    const signature = hdNode.sign(hash).toString("hex");
    const pubKey = hdNode.publicKey.toString("hex");
    const signedPayload = {
        signature,
        publicKey: pubKey,
        hash: hash.toString("hex")
    };
    signedPayload[key] = payload;
    return signedPayload;
}
export function getPayloadFD(rawPayload, extraPayload, hdNode, key = "requestBody") {
    // rawPayload.timestamp = Date.now();
    const payload = JSON.stringify(rawPayload);
    const hash = EthUtil.keccak256(payload);
    const signature = hdNode.sign(hash).toString("hex");
    const pubKey = hdNode.publicKey.toString("hex");
    // node, buffers
    if (POLYFILL_FORMDATA) {
        const data = new FormDataNode();
        data.append(key, payload);
        data.append("signature", signature);
        data.append("publicKey", pubKey);
        // data.append("hash", hash);
        if (extraPayload) {
            Object.keys(extraPayload).forEach(key => {
                const pl = extraPayload[key];
                data.append(key, pl, {
                    filename: key,
                    contentType: "application/octet-stream",
                    knownLength: pl.length
                });
            });
        }
        return data;
    }
    else {
        const data = new FormData();
        data.append(key, payload);
        data.append("signature", signature);
        data.append("publicKey", pubKey);
        if (extraPayload) {
            Object.keys(extraPayload).forEach(key => {
                data.append(key, new Blob([extraPayload[key].buffer]), key);
            });
        }
        return data;
    }
}
export { checkPaymentStatus } from "./requests/checkPaymentStatus";
export { createAccount } from "./requests/createAccount";
export { getMetadata, setMetadata, createMetadata, deleteMetadata } from "./requests/metadata";
