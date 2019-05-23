import Axios from "axios";
import { getPayload } from "../request";
// Metadata as hexstring as of right now
export async function deleteFile(endpoint, hdNode, fileID) {
    const payload = { fileID };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/delete", signedPayload);
}
