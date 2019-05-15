import FormDataNode from "form-data";
import * as EthUtil from "ethereumjs-util";
import Axios from "axios";

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
  }

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
  if(POLYFILL_FORMDATA) {
    const data = new FormDataNode();

    data.append(key, payload);
    data.append("signature", signature);
    data.append("publicKey", pubKey);
    // data.append("hash", hash);

    if(extraPayload) {
      Object.keys(extraPayload).forEach(key => {
        const pl = extraPayload[key]
        data.append(key, data, {
          filename: key,
          contentType: "application/octet-stream",
          knownLength: data.length
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

export async function checkPaymentStatus(endpoint, hdNode) {
  const payload = {
    timestamp: Math.floor(Date.now() / 1000)
  }

  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/account-data", signedPayload);
}

export async function createAccount(endpoint, hdNode, metadataKey) {
  const payload = {
    metadataKey: metadataKey,
    durationInMonths: 12,
    storageLimit: 100
  }

  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/accounts", signedPayload);
}

// Metadata as hexstring as of right now
export async function writeMetadata(endpoint, hdNode, metadataKey, metadata) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = { timestamp, metadata, metadataKey };
  const signedPayload = getPayload(payload, hdNode);

  return Axios.post("/metadata/set", signedPayload);
}

export async function getMetadata(endpoint, hdNode, metadataKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = { timestamp, metadataKey };
  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/metadata/get", signedPayload);
}
