import Axios from "axios";
import HDKey from "hdkey";

import { getPayload } from "../request";

export async function createAccount(endpoint: string, hdNode: HDKey, metadataKey: string, duration = 12, limit = 128) {
  const payload = {
    metadataKey: metadataKey,
    durationInMonths: duration,
    // TODO: I'm not sure why this is like this, but it doesn't match what was planned
    storageLimit: limit
  }

  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/accounts", signedPayload);
}
