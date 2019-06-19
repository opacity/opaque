import HDKey from "hdkey";
export declare function createAccount(endpoint: string, hdNode: HDKey, metadataKey: string, duration?: number, limit?: number): Promise<import("axios").AxiosResponse<any>>;
