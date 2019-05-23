import Axios from "axios";
import HDKey from "hdkey";

import { getPayload } from "../request";

export async function createAccount(endpoint: string, hdNode: HDKey, metadataKey: string) {
  const payload = {
    metadataKey: metadataKey,
    durationInMonths: 12,
    // TODO: I'm not sure why this is like this, but it doesn't match what was planned
    storageLimit: 128
  }

  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/accounts", signedPayload);
}
