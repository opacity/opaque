import { Transform } from "readable-stream";
export default class EncryptStream extends Transform {
    options: any;
    key: any;
    constructor(key: any, options: any);
    _transform(data: any, encoding: any, callback: any): void;
}
