import HDKey from "hdkey";
/**
 * request creating a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
export declare function createMetadata(endpoint: string, hdNode: HDKey, metadataKey: string): Promise<import("axios").AxiosResponse<any>>;
/**
 * request deleting a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
export declare function deleteMetadata(endpoint: string, hdNode: HDKey, metadataKey: string): Promise<import("axios").AxiosResponse<any>>;
/**
 * request changing a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 * @param metadata - the metadata to put
 *
 * @internal
 */
export declare function setMetadata(endpoint: string, hdNode: HDKey, metadataKey: string, metadata: string): Promise<import("axios").AxiosResponse<any>>;
/**
 * request get of a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
export declare function getMetadata(endpoint: string, hdNode: HDKey, metadataKey: string): Promise<import("axios").AxiosResponse<any>>;
