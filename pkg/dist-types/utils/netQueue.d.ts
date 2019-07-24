/// <reference types="node" />
import { EventEmitter } from "events";
declare type NetQueueProps<T> = {
    fetch: () => T | Promise<T>;
    update: (obj: T) => void;
    data?: {
        [key: string]: any;
    };
    timeout?: number;
};
declare type NetQueueEntry = {
    type: string;
    payload: any;
};
declare type NetQueueType<T> = {
    type: string;
    handler: (obj: T, payload: any) => T | Promise<T>;
};
declare class NetQueue<T> extends EventEmitter {
    updating: boolean;
    queue: NetQueueEntry[];
    types: {
        [type: string]: (obj: T, payload: any) => T | Promise<T>;
    };
    result: T;
    data: {
        [key: string]: any;
    };
    private _fetch;
    private _update;
    private _timeout;
    constructor({ fetch, update, data, timeout }: NetQueueProps<T>);
    push: ({ type, payload }: NetQueueEntry) => void;
    addType: ({ type, handler }: NetQueueType<T>) => void;
    private _process;
}
export { NetQueue, NetQueueProps, NetQueueEntry, NetQueueType };
