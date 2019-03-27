import ForgeMd from "node-forge/lib/md";
import ForgeRandom from "node-forge/lib/random";
import ForgeUtil from "node-forge/lib/util";
import isBuffer from "is-buffer";
import FileSourceStream from "../streams/fileSourceStream";
import BufferSourceStream from "../streams/bufferSourceStream";
import mime from "mime/lite";
import { FILENAME_MAX_LENGTH, BLOCK_OVERHEAD } from "./constants";

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

  const handle = Forge.util.bytesToHex(hash) + Forge.util.bytesToHex(key);

  return { hash, key, handle }
}

// Return datamap hash and encryption key from handle
// TODO: Decide on format and derivation
export function keysFromHandle(handle) {
  const bytes = Forge.utils.binary.hex.decode(handle);
  const buf = new ByteBuffer(bytes);
  const hash = buf.getBytes(32);
  const key = buf.getBytes(32);

  return {
    hash: new ByteBuffer(hash),
    key: new ByteBuffer(key),
    handle
  }
}

export function sanitizeFilename(filename) {
  if(filename.length > FILENAME_MAX_LENGTH) {
    const l = (FILENAME_MAX_LENGTH / 2) - 2;
    const start = filename.substring(0, l);
    const end = filename.substring(filename.length - l);
    filename = start + "..." + end;
  }

  return filename;
}

// Rudimentary format normalization
export function getFileData(file, nameFallback = "file") {
  if(isBuffer(file)) {
    console.log("buffer");
    const buf = file;

    file = {
      data: buf,
      size: buf.length,
      name: nameFallback,
      type: "application/octet-stream",
      reader: BufferSourceStream
    }
  } else if(file && file.data && isBuffer(file.data)) {
    console.log("buffer with object");
    file.size = file.data.length;
    file.name = file.name || nameFallback;
    file.type = file.type || mime.getType(file.name) || "application/octet-stream";
    file.reader = BufferSourceStream
  } else {
    console.log("file");
    file.reader = FileSourceStream;
  }

  console.log("file", file);

  return file;
}

// get true upload size, accounting for encryption overhead
export function getUploadSize(size, params) {
  const dataPerBlock = params.blockSize - BLOCK_OVERHEAD;
  const blockCount = Math.ceil(size / dataPerBlock);

  return size + blockCount * BLOCK_OVERHEAD;
}


