import Axios from "axios";
import { getPayload } from "../request";
/**
 * request the creation of an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKey
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
export async function createAccount(endpoint, hdNode, metadataKey, duration = 12, limit = 128) {
    const payload = {
        metadataKey: metadataKey,
        durationInMonths: duration,
        storageLimit: limit
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/accounts", signedPayload);
}
