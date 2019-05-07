import { md as ForgeMd, random as ForgeRandom, util as ForgeUtil } from "node-forge";
import isBuffer from "is-buffer";
import mime from "mime/lite";
import { FILENAME_MAX_LENGTH, DEFAULT_BLOCK_SIZE, BLOCK_OVERHEAD } from "./constants";
const Forge = { md: ForgeMd, random: ForgeRandom, util: ForgeUtil };
const ByteBuffer = Forge.util.ByteBuffer;
// Generate new handle, datamap entry hash and encryption key
// TODO: Decide on format and derivation
export function generateFileKeys() {
    const hash = Forge.md.sha256
        .create()
        .update(Forge.random.getBytesSync(32))
        .digest();
    const key = Forge.md.sha256
        .create()
        .update(Forge.random.getBytesSync(32))
        .digest();
    const handle = hash.toHex() + key.toHex();
    return {
        hash: hash.toHex(),
        key,
        handle
    };
}
// Return datamap hash and encryption key from handle
// TODO: Decide on format and derivation
export function keysFromHandle(handle) {
    const bytes = Forge.util.binary.hex.decode(handle);
    const buf = new ByteBuffer(bytes);
    const hash = buf.getBytes(32);
    const key = buf.getBytes(32);
    return {
        hash: Forge.util.bytesToHex(hash),
        key: new ByteBuffer(key),
        handle
    };
}
export function sanitizeFilename(filename) {
    if (filename.length > FILENAME_MAX_LENGTH) {
        const l = (FILENAME_MAX_LENGTH / 2) - 2;
        const start = filename.substring(0, l);
        const end = filename.substring(filename.length - l);
        filename = start + "..." + end;
    }
    return filename;
}
// Rudimentary format normalization
export function getFileData(file, nameFallback = "file") {
    if (isBuffer(file)) {
        return {
            data: file,
            size: file.length,
            name: nameFallback,
            type: "application/octet-stream",
        };
    }
    else if (file && file.data && isBuffer(file.data)) {
        return {
            data: file.data,
            size: file.data.length,
            name: file.name || nameFallback,
            type: file.type || mime.getType(file.name) || "application/octet-stream",
        };
    }
    else {
        // TODO
        // file.reader = FileSourceStream;
    }
}
// get true upload size, accounting for encryption overhead
export function getUploadSize(size, params) {
    const blockSize = params.blockSize || DEFAULT_BLOCK_SIZE;
    const blockCount = Math.ceil(size / blockSize);
    return size + blockCount * BLOCK_OVERHEAD;
}