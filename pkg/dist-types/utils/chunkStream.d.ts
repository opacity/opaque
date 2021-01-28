import { ReadableStream, WritableStream, TransformStream } from "web-streams-polyfill/ponyfill";
declare type Hooks = {
    transform?: (c: Uint8Array) => void;
    enqueue?: (c: Uint8Array) => void;
    flush?: (c: Uint8Array) => void;
};
export declare class Uint8ArrayChunkStream implements TransformStream<Uint8Array, Uint8Array> {
    _size: number;
    _buffer: Uint8Array;
    _l: number;
    _hooks: Hooks;
    _transformer: TransformStream<Uint8Array, Uint8Array>;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    constructor(size: number, writableStrategy?: QueuingStrategy<Uint8Array>, readableStrategy?: QueuingStrategy<Uint8Array>, hooks?: Hooks);
    _transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>): void;
}
export {};
