import Axios from "axios";
import HDKey from "hdkey";

import { getPayload } from "../request";

export async function createMetadata(endpoint: string, hdNode: HDKey, metadataKey: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = { timestamp, metadataKey };
  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/metadata/create", signedPayload);
}

export async function deleteMetadata(endpoint: string, hdNode: HDKey, metadataKey: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = { timestamp, metadataKey };
  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/metadata/delete", signedPayload);
}

// Metadata as hexstring as of right now
export async function setMetadata(endpoint: string, hdNode: HDKey, metadataKey: string, metadata: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = { timestamp, metadata, metadataKey };
  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/metadata/set", signedPayload);
}

export async function getMetadata(endpoint: string, hdNode: HDKey, metadataKey: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = { timestamp, metadataKey };
  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/metadata/get", signedPayload);
}
