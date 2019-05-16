import Axios from "axios";
import HDKey from "hdkey";

import { getPayload } from "../request";

// Metadata as hexstring as of right now
export async function setMetadata(endpoint: string, hdNode: HDKey, metadataKey: string, metadata: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = { timestamp, metadata, metadataKey };
  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/metadata/set", signedPayload);
}

export async function getMetadata(endpoint: string, hdNode: HDKey, metadataKey: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = { timestamp, metadataKey };
  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/metadata/get", signedPayload);
}
