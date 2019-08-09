import HDKey from "hdkey";
/**
 * check whether a payment has gone through for an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to check
 *
 * @internal
 */
export declare function checkPaymentStatus(endpoint: string, hdNode: HDKey): Promise<import("axios").AxiosResponse<any>>;
