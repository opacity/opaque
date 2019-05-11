import FormDataNode from "form-data";
import * as EthUtil from "ethereumjs-util";
const POLYFILL_FORMDATA = typeof FormData === "undefined";
export function getPayload(rawPayload, extraPayload, hdNode, key = "requestBody") {
    // rawPayload.timestamp = Date.now();
    const payload = JSON.stringify(rawPayload);
    const hash = EthUtil.keccak256(hdNode.publicKey);
    const signature = hdNode.sign(hash).toString("hex");
    const sigHex = signature.toString("hex");
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
                data.append(key, data, {
                    filename: key,
                    contentType: "application/octet-stream",
                    knownLength: data.length
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
