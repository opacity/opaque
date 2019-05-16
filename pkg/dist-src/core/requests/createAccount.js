import Axios from "axios";
import { getPayload } from "../request";
export async function createAccount(endpoint, hdNode, metadataKey) {
    const payload = {
        metadataKey: metadataKey,
        durationInMonths: 12,
        storageLimit: 100
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/accounts", signedPayload);
}
