import Axios from "axios";
import HDKey from "hdkey";

import { getPayload } from "../request";

export async function checkPaymentStatus(endpoint: string, hdNode: HDKey) {
  const payload = {
    timestamp: Math.floor(Date.now() / 1000)
  }

  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/account-data", signedPayload);
}
