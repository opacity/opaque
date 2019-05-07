import { Readable } from "readable-stream";
export default class BufferSourceStream extends Readable {
    offset: any;
    options: any;
    buffer: any;
    constructor(data: any, options: any);
    _read(): void;
    _readChunkFromBuffer(): any;
}
