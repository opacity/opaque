import Axios from "axios";
import HDKey from "hdkey";

import { getPayload } from "../request";

// Metadata as hexstring as of right now
export async function deleteFile(endpoint: string, hdNode: HDKey, fileID: string) {
  const payload = { fileID };
  const signedPayload = getPayload(payload, hdNode);

  return Axios.post(endpoint + "/api/v1/delete", signedPayload);
}
