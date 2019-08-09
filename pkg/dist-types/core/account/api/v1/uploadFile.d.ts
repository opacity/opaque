/// <reference types="node" />
import { EventEmitter } from "events";
import { MasterHandle } from "../../../../account";
declare const uploadFile: (masterHandle: MasterHandle, dir: string, file: File) => EventEmitter;
export { uploadFile };
