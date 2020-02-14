import Axios from "axios";
import { getPayload } from "../request";
/**
 * check the status of upgrading an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKeys - all metadata keys from the account to upgrade
 * @param fileHandles - all file handles from the account to upgrade
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
export async function upgradeAccountStatus(endpoint, hdNode, metadataKeys, fileHandles, duration = 12, limit = 128) {
    const payload = {
        metadataKeys,
        fileHandles,
        durationInMonths: duration,
        storageLimit: limit
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/upgrade", signedPayload);
}
/**
 * request an invoice for upgrading an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
export async function upgradeAccountInvoice(endpoint, hdNode, duration = 12, limit = 128) {
    const payload = {
        durationInMonths: duration,
        storageLimit: limit
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/upgrade/invoice", signedPayload);
}
