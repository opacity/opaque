/// <reference types="node" />
import { EventEmitter } from "events";
import { MasterHandle } from "../../../../account";
declare type EE = EventEmitter & {
    handle: string;
};
declare const uploadFile: (masterHandle: MasterHandle, dir: string, file: File) => Promise<EE>;
export { uploadFile };
