import { keccak256 } from "js-sha3";
import { bytesToHex } from "./hex";
export const getPayload = async ({ crypto, payload: rawPayload, key, payloadKey = "requestBody" }) => {
    // rawPayload.timestamp = Date.now();
    const payload = JSON.stringify(rawPayload);
    const hash = new Uint8Array(keccak256.arrayBuffer(payload));
    const signature = await crypto.sign(key, hash);
    const pubKey = await crypto.getPublicKey(key);
    const data = {
        [payloadKey]: payload,
        "signature": bytesToHex(signature),
        "publicKey": bytesToHex(pubKey),
        "hash": bytesToHex(hash)
    };
    return data;
};
export const getPayloadFD = async ({ crypto, payload: rawPayload, extraPayload, key, payloadKey = "requestBody" }) => {
    // rawPayload.timestamp = Date.now();
    const payload = JSON.stringify(rawPayload);
    const hash = new Uint8Array(keccak256.arrayBuffer(payload));
    const signature = await crypto.sign(key, hash);
    const pubKey = await crypto.getPublicKey(key);
    const data = new FormData();
    data.append(payloadKey, payload);
    data.append("signature", bytesToHex(signature));
    data.append("publicKey", bytesToHex(pubKey));
    data.append("hash", bytesToHex(hash));
    if (extraPayload) {
        Object.keys(extraPayload).forEach(key => {
            data.append(key, new Blob([extraPayload[key].buffer]), key);
        });
    }
    return data;
};
