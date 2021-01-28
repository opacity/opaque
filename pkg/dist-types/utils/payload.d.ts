import { CryptoMiddleware } from "../middleware";
export declare type PayloadArgs<P extends {
    [key: string]: any;
} = {
    [key: string]: any;
}> = {
    crypto: CryptoMiddleware;
    payload: P;
    key?: Uint8Array;
    payloadKey?: string;
};
export declare type PayloadData = {
    [payloadKey: string]: string;
    signature: string;
    publicKey: string;
    hash: string;
};
export declare const getPayload: <P extends {
    [key: string]: any;
}>({ crypto, payload: rawPayload, key, payloadKey }: PayloadArgs<P>) => Promise<PayloadData>;
export declare type PayloadFDArgs<P extends {
    [key: string]: any;
} = {
    [key: string]: any;
}, EP extends {
    [key: string]: any;
} = {
    [key: string]: Uint8Array;
}> = {
    crypto: CryptoMiddleware;
    payload: P;
    extraPayload: EP;
    key?: Uint8Array;
    payloadKey?: string;
};
export declare const getPayloadFD: <P extends {
    [key: string]: any;
}, EP extends {
    [key: string]: any;
}>({ crypto, payload: rawPayload, extraPayload, key, payloadKey }: PayloadFDArgs<P, EP>) => Promise<FormData>;
