import { Transform } from "readable-stream";
import { encryptBytes } from "../core/encryption";
import ForgeUtil from "node-forge/lib/util";

const Forge = { util: ForgeUtil };
const DEFAULT_OPTIONS = Object.freeze({
  objectMode: false
});

export default class EncryptStream extends Transform {
  options
  key

  constructor(key, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super(opts);
    this.options = opts;
    this.key = key;
  }
  _transform(data, encoding, callback) {
    const chunk = encryptBytes(this.key, data);
    const buf = Forge.util.binary.raw.decode(chunk.getBytes());

    this.push(buf);
    callback(null);
  }
}
