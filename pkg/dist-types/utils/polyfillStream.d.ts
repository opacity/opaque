import { ReadableStream as ReadableStreamPolyfill } from "web-streams-polyfill";
export declare const polyfillReadableStream: <T>(rs: ReadableStream<T>, strategy?: QueuingStrategy<T>) => ReadableStreamPolyfill<T>;
