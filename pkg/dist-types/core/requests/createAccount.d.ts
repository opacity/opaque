import HDKey from "hdkey";
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
export declare function createAccount(endpoint: string, hdNode: HDKey, metadataKey: string, duration?: number, limit?: number): Promise<import("axios").AxiosResponse<any>>;
