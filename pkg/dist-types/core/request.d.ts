export declare function getPayload(rawPayload: any, hdNode: any, key?: string): {
    signature: any;
    publicKey: any;
    hash: string;
};
export declare function getPayloadFD(rawPayload: any, extraPayload: any, hdNode: any, key?: string): any;
export declare function checkPaymentStatus(endpoint: any, hdNode: any): Promise<import("axios").AxiosResponse<any>>;
export declare function createAccount(endpoint: any, hdNode: any, metadataKey: any): Promise<import("axios").AxiosResponse<any>>;
