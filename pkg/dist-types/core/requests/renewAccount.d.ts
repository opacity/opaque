import HDKey from "hdkey";
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
export declare function renewAccountStatus(endpoint: string, hdNode: HDKey, metadataKeys: string[], fileHandles: string[], duration?: number): Promise<import("axios").AxiosResponse<any>>;
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
export declare function renewAccountInvoice(endpoint: string, hdNode: HDKey, duration?: number): Promise<import("axios").AxiosResponse<any>>;
