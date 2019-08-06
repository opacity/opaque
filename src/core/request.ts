import FormDataNode from "form-data";
import * as EthUtil from "ethereumjs-util";
import HDKey from "hdkey"

const POLYFILL_FORMDATA = typeof FormData === "undefined";

/**
 * get a signed payload from an hdkey
 *
 * @param rawPayload - a payload object to be processed and signed
 * @param hdNode = the account to sign with
 * @param key
 *
 * @internal
 */
export function getPayload(rawPayload, hdNode: HDKey, key = "requestBody") {
  const payload = JSON.stringify(rawPayload);
  const hash = EthUtil.keccak256(payload);
  const signature = hdNode.sign(hash).toString("hex");
  const pubKey = hdNode.publicKey.toString("hex");
  const signedPayload = {
    signature,
    publicKey: pubKey,
    hash: hash.toString("hex")
  }

  signedPayload[key] = payload;

  return signedPayload;
}

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
export function getPayloadFD(rawPayload: { [key: string]: any }, extraPayload, hdNode: HDKey, key = "requestBody") {
  // rawPayload.timestamp = Date.now();

  const payload = JSON.stringify(rawPayload);
  const hash = EthUtil.keccak256(payload);
  const signature = hdNode.sign(hash).toString("hex");
  const pubKey = hdNode.publicKey.toString("hex");

  // node, buffers
  if(POLYFILL_FORMDATA) {
    const data = new FormDataNode();

    data.append(key, payload);
    data.append("signature", signature);
    data.append("publicKey", pubKey);
    // data.append("hash", hash);

    if(extraPayload) {
      Object.keys(extraPayload).forEach(key => {
        const pl = Buffer.from(extraPayload[key]);

        data.append(key, pl, {
          filename: key,
          contentType: "application/octet-stream",
          knownLength: pl.length
        });
      });
    }

    return data;
  } else {
    const data = new FormData();

    data.append(key, payload);
    data.append("signature", signature);
    data.append("publicKey", pubKey);

    if(extraPayload) {
      Object.keys(extraPayload).forEach(key => {
        data.append(key, new Blob([extraPayload[key].buffer]), key);
      });
    }

    return data;
  }
}

export { getPlans } from "./requests/getPlans";
export { checkPaymentStatus } from "./requests/checkPaymentStatus";
export { createAccount } from "./requests/createAccount";
export { getMetadata, setMetadata, createMetadata, deleteMetadata } from "./requests/metadata";
