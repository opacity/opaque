import { Transform } from "readable-stream";
export default class DecryptStream extends Transform {
    options: any;
    blockSize: any;
    key: any;
    iter: any;
    constructor(key: any, options?: any);
    _transform(chunk: any, encoding: any, callback: any): void;
}
