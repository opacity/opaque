import Axios from "axios";
import { getPayload } from "../request";
/**
 * check whether a payment has gone through for an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to check
 *
 * @internal
 */
export async function checkPaymentStatus(endpoint, hdNode) {
    const payload = {
        timestamp: Math.floor(Date.now() / 1000)
    };
    const signedPayload = getPayload(payload, hdNode);
    return Axios.post(endpoint + "/api/v1/account-data", signedPayload);
}
