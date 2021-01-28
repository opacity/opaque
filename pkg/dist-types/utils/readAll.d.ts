import { ReadableStream } from "web-streams-polyfill/ponyfill";
export declare const readAllIntoUint8Array: (s: ReadableStream<Uint8Array>, size: number) => Promise<Uint8Array>;
