/// <reference types="node" />
import { EventEmitter } from "events";
import { MasterHandle } from "../../../../account";
import { FileMeta } from "../../../metadata";
declare type EE = EventEmitter & {
    toBuffer: () => Promise<Buffer>;
    toFile: () => Promise<File>;
    metadata: () => Promise<FileMeta>;
    stream: () => Promise<ReadableStream<Uint8Array>>;
};
declare const downloadFile: (masterHandle: MasterHandle, handle: string) => EE;
export { downloadFile };
