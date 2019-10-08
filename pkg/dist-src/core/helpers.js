import { md as ForgeMd, random as ForgeRandom, util as ForgeUtil } from "node-forge";
import isBuffer from "is-buffer";
import FileSourceStream from "../streams/fileSourceStream";
import BufferSourceStream from "../streams/bufferSourceStream";
import mime from "mime/lite";
import { FILENAME_MAX_LENGTH, BLOCK_OVERHEAD, DEFAULT_BLOCK_SIZE, DEFAULT_PART_SIZE } from "./constants";
const Forge = { md: ForgeMd, random: ForgeRandom, util: ForgeUtil };
const ByteBuffer = Forge.util.ByteBuffer;
// Generate new handle, datamap entry hash and encryption key
// TODO: Decide on format and derivation
export function generateFileKeys() {
    const hash = Forge.md.sha256
        .create()
        .update(Forge.random.getBytesSync(32))
        .digest().toHex();
    const key = Forge.md.sha256
        .create()
        .update(Forge.random.getBytesSync(32))
        .digest().toHex();
    const handle = hash + key;
    return {
        hash,
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
        key: Forge.util.bytesToHex(key),
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
        file = file;
        return {
            data: file,
            size: file.length,
            name: nameFallback,
            type: "application/octet-stream",
            reader: BufferSourceStream
        };
    }
    else if (file && file.data && isBuffer(file.data)) {
        file = file;
        return {
            data: file.data,
            size: file.data.length,
            name: file.name || nameFallback,
            type: file.type || mime.getType(file.name) || "",
            reader: BufferSourceStream
        };
    }
    else {
        // TODO
        file.reader = FileSourceStream;
    }
    return file;
}
export function getMimeType(metadata) {
    return metadata.type || mime.getType(metadata.name) || "";
}
// get true upload size, accounting for encryption overhead
export function getUploadSize(size, params) {
    const blockSize = params.blockSize || DEFAULT_BLOCK_SIZE;
    const blockCount = Math.ceil(size / blockSize);
    return size + blockCount * BLOCK_OVERHEAD;
}
// get
export function getEndIndex(uploadSize, params) {
    const blockSize = params.blockSize || DEFAULT_BLOCK_SIZE;
    const partSize = params.partSize || DEFAULT_PART_SIZE;
    const chunkSize = blockSize + BLOCK_OVERHEAD;
    const chunkCount = Math.ceil(uploadSize / chunkSize);
    const chunksPerPart = Math.ceil(partSize / chunkSize);
    const endIndex = Math.ceil(chunkCount / chunksPerPart);
    return endIndex;
}
export function getBlockSize(params) {
    if (params && params.blockSize) {
        return params.blockSize;
    }
    else if (params && params.p && params.p.blockSize) {
        return params.p.blockSize;
    }
    else {
        return DEFAULT_BLOCK_SIZE;
    }
}
