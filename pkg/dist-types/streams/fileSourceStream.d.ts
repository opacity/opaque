import { Readable } from "readable-stream";
export default class FileSourceStream extends Readable {
    offset: any;
    options: any;
    blob: any;
    reader: any;
    constructor(blob: any, options: any);
    _read(): void;
    _readChunkFromBlob(): boolean;
    _onChunkRead(event: any): void;
}
