import { cipher as ForgeCipher, md as ForgeMd, util as ForgeUtil } from "node-forge";
const Forge = { cipher: ForgeCipher, md: ForgeMd, util: ForgeUtil };
export function getHash(hash, offset, cache = null) {
    if (offset > Number.MAX_SAFE_INTEGER || offset < 0) {
        return false;
    }
    let depth = Math.max(1, 1 + Math.floor(Math.log2(offset)));
    let path = 0;
    while (depth > 0) {
        const bit = (offset >>> (depth - 1)) & 1;
        const md = Forge.md.sha256.create();
        const high = hash.getBytes(16);
        const low = hash.getBytes(16);
        // Switch blocks on 1, default on 0
        if (bit) {
            md.update(low).update(high);
        }
        else {
            md.update(high).update(low);
        }
        hash = md.digest();
        path = (path << 1) | bit;
        depth--;
    }
    return Forge.md.sha512.sha256
        .create()
        .update(hash.bytes())
        .digest()
        .toHex();
}
// TODO: Iterable datamap
export default class Datamap {
    constructor(hash, offset = 0) {
        this.hash = hash;
        this.offset = offset;
        this.cache = [];
    }
    next() {
    }
    hashAt(offset) {
        this.cache.length = 0;
    }
}
