import { CryptoMiddleware, NetworkMiddleware } from "./middleware";
import { FileMeta } from "./core/metadata";
import { ReadableStream } from "web-streams-polyfill/ponyfill";
import { OQ } from "./utils/oqueue";
declare type DownloadConfig = {
    storageNode: string;
    metadataNode: string;
    crypto: CryptoMiddleware;
    network: NetworkMiddleware;
};
declare type DownloadArgs = {
    config: DownloadConfig;
    handle: Uint8Array;
};
export declare class Download extends EventTarget {
    config: DownloadConfig;
    _location: Uint8Array;
    _key: Uint8Array;
    _cancelled: boolean;
    _errored: boolean;
    _started: boolean;
    _done: boolean;
    _paused: boolean;
    get cancelled(): boolean;
    get errored(): boolean;
    get started(): boolean;
    get done(): boolean;
    _unpaused: Promise<void>;
    _unpause: (value: void) => void;
    _finished: Promise<void>;
    _resolve: (value?: void) => void;
    _reject: (reason?: any) => void;
    _size: number;
    _sizeOnFS: number;
    _numberOfBlocks: number;
    _numberOfParts: number;
    get size(): number;
    get sizeOnFS(): number;
    _progress: {
        network: number;
        decrypt: number;
    };
    _downloadUrl: string;
    _metadata: FileMeta;
    _netQueue: OQ<void>;
    _decryptQueue: OQ<Uint8Array>;
    _output: ReadableStream<Uint8Array>;
    get name(): string;
    constructor({ config, handle }: DownloadArgs);
    pause(): void;
    unpause(): void;
    downloadUrl(): Promise<string>;
    metadata(): Promise<FileMeta>;
    start(): Promise<ReadableStream<Uint8Array>>;
    finish(): Promise<void>;
    cancel(): Promise<void>;
}
export {};
