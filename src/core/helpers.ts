import { md as ForgeMd, random as ForgeRandom, util as ForgeUtil } from "node-forge"
import isBuffer from "is-buffer";
import FileSourceStream from "../streams/fileSourceStream";
import BufferSourceStream from "../streams/bufferSourceStream";
import { Readable } from "readable-stream";
import mime from "mime/lite";
import {
  FILENAME_MAX_LENGTH,
  DEFAULT_BLOCK_SIZE,
  BLOCK_OVERHEAD
} from "./constants";
import { Buffer } from "safe-buffer";

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
  }
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
  }
}

export function sanitizeFilename(filename: string) {
  if(filename.length > FILENAME_MAX_LENGTH) {
    const l = (FILENAME_MAX_LENGTH / 2) - 2;
    const start = filename.substring(0, l);
    const end = filename.substring(filename.length - l);
    filename = start + "..." + end;
  }

  return filename;
}

export type FileData = {
  data: Buffer
  size: number
  name: string
  type: string
  reader: Readable
}

// Rudimentary format normalization
export function getFileData(file: Buffer | FileData, nameFallback = "file"): FileData {
  if(isBuffer(file)) {
    return {
      data: file as Buffer,
      size: file.length,
      name: nameFallback,
      type: "application/octet-stream",
      reader: BufferSourceStream as unknown  as Readable
    }
  } else if(file && (file as FileData).data && isBuffer((file as FileData).data)) {
    return {
      data: (file as FileData).data,
      size: (file as FileData).data.length,
      name: (file as FileData).name || nameFallback,
      type: (file as FileData).type || mime.getType((file as FileData).name) || "application/octet-stream",
      reader: BufferSourceStream as unknown  as Readable
    }
  } else {
    // TODO
    (file as FileData).reader = FileSourceStream as unknown as Readable;
  }

  return file as FileData;
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
  const chunkSize = blockSize + BLOCK_OVERHEAD;
  const chunkCount = Math.ceil(uploadSize / chunkSize);
  const chunksPerPart = Math.ceil(params.partSize / chunkSize);
  const endIndex = Math.ceil(chunkCount / chunksPerPart);

  return endIndex;
}
