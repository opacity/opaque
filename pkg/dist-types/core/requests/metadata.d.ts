import HDKey from "hdkey";
export declare function createMetadata(endpoint: string, hdNode: HDKey, metadataKey: string): Promise<import("axios").AxiosResponse<any>>;
export declare function deleteMetadata(endpoint: string, hdNode: HDKey, metadataKey: string): Promise<import("axios").AxiosResponse<any>>;
export declare function setMetadata(endpoint: string, hdNode: HDKey, metadataKey: string, metadata: string): Promise<import("axios").AxiosResponse<any>>;
export declare function getMetadata(endpoint: string, hdNode: HDKey, metadataKey: string): Promise<import("axios").AxiosResponse<any>>;
