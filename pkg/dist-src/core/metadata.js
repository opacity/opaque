import { sanitizeFilename } from "./helpers";
import { encryptString, decryptString } from "./encryption";
import { util as ForgeUtil } from "node-forge";
const Forge = { util: ForgeUtil };
const PROTOCOL_VERSION = 1;
export function createMetadata(file, opts) {
    const filename = sanitizeFilename(file.name);
    const metadata = {
        name: filename,
        type: file.type,
        size: file.size,
        p: opts
    };
    return metadata;
}
export function encryptMetadata(metadata, key) {
    const encryptedMeta = encryptString(key, JSON.stringify(metadata), "utf8");
    return Forge.util.binary.raw.decode(encryptedMeta.getBytes());
}
export function decryptMetadata(data, key) {
    const byteStr = Forge.util.binary.raw.encode(data);
    const byteBuffer = new Forge.util.ByteBuffer(byteStr);
    const meta = JSON.parse(decryptString(key, byteBuffer));
    return meta;
}
