import HDKey from "hdkey";
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
export declare function upgradeAccountStatus(endpoint: string, hdNode: HDKey, metadataKeys: string[], fileHandles: string[], duration?: number, limit?: number): Promise<import("axios").AxiosResponse<any>>;
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
export declare function upgradeAccountInvoice(endpoint: string, hdNode: HDKey, duration?: number, limit?: number): Promise<import("axios").AxiosResponse<any>>;
