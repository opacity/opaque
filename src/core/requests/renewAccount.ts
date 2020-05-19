import Axios from "axios";
import HDKey from "hdkey";

import { getPayload } from "../request";

/**
 * check the status of renewing an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKeys - all metadata keys from the account to renew
 * @param fileHandles - all file handles from the account to renew
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
export async function renewAccountStatus(endpoint: string, hdNode: HDKey, metadataKeys: string[], fileHandles: string[], duration = 12) {
	const payload = {
		metadataKeys,
		fileHandles,
		durationInMonths: duration
	}

	const signedPayload = getPayload(payload, hdNode);

	return Axios.post(endpoint + "/api/v1/renew", signedPayload);
}

/**
 * request an invoice for renewing an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
export async function renewAccountInvoice(endpoint: string, hdNode: HDKey, duration = 12) {
	const payload = {
		durationInMonths: duration
	}

	const signedPayload = getPayload(payload, hdNode);

	return Axios.post(endpoint + "/api/v1/renew/invoice", signedPayload);
}
