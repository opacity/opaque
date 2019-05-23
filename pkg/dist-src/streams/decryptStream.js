import { Transform } from "readable-stream";
import { decryptBytes } from "../core/encryption";
import { util as ForgeUtil } from "node-forge";
import { DEFAULT_BLOCK_SIZE, BLOCK_OVERHEAD } from "../core/constants";
import { getBlockSize } from "../core/helpers";
const Forge = { util: ForgeUtil };
const DEFAULT_OPTIONS = Object.freeze({
    binaryMode: false,
    objectMode: true,
    blockSize: DEFAULT_BLOCK_SIZE
});
export default class DecryptStream extends Transform {
    constructor(key, options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options);
        super(opts);
        this.options = opts;
        this.key = key;
        this.iter = 0;
        this.blockSize = getBlockSize(options);
    }
    _transform(chunk, encoding, callback) {
        const blockSize = this.blockSize;
        const chunkSize = blockSize + BLOCK_OVERHEAD;
        const length = chunk.length;
        for (let offset = 0; offset < length; offset += chunkSize) {
            const limit = Math.min(offset + chunkSize, length);
            const buf = chunk.slice(offset, limit);
            const data = decryptBytes(this.key, buf);
            if (data) {
                this.push(data);
            }
            else {
                this.emit("error", "Error decrypting data block");
            }
        }
        callback(null);
    }
}
