import { md as ForgeMd, random as ForgeRandom, util as ForgeUtil } from "node-forge"
import isBuffer from "is-buffer";
import FileSourceStream from "../streams/fileSourceStream";
import BufferSourceStream from "../streams/bufferSourceStream";
import { Readable } from "readable-stream";
import mime from "mime/lite";
import { FileMeta, FileMetaOptions } from "./metadata"
import {
  FILENAME_MAX_LENGTH,
  BLOCK_OVERHEAD,
  DEFAULT_BLOCK_SIZE,
  DEFAULT_PART_SIZE
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
  }
}

// Return datamap hash and encryption key from handle
// TODO: Decide on format and derivation
export function keysFromHandle(handle: string) {
  const bytes = Forge.util.binary.hex.decode(handle);
  const buf = new ByteBuffer(bytes);
  const hash = buf.getBytes(32);
  const key = buf.getBytes(32);

  return {
    hash: Forge.util.bytesToHex(hash),
    key: Forge.util.bytesToHex(key),
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
  reader: typeof Readable | typeof BufferSourceStream | typeof FileSourceStream
}

// Rudimentary format normalization
export function getFileData(file: Buffer | FileData, nameFallback = "file"): FileData {
  if (isBuffer(file)) {
    file = file as Buffer
    return {
      data: file,
      size: file.length,
      name: nameFallback,
      type: "application/octet-stream",
      reader: BufferSourceStream
    }
  } else if(file && (file as FileData).data && isBuffer((file as FileData).data)) {
    file = file as FileData
    return {
      data: file.data,
      size: file.data.length,
      name: file.name || nameFallback,
      type: file.type || mime.getType(file.name) || "",
      reader: BufferSourceStream
    }
  } else {
    // TODO
    (file as unknown as FileData).reader = FileSourceStream;
  }

  return file as FileData;
}

export function getMimeType(metadata: FileMeta) {
  return metadata.type || mime.getType(metadata.name) || "";
}

// get true upload size, accounting for encryption overhead
export function getUploadSize(size: number, params: FileMetaOptions) {
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
  if(params && params.blockSize) {
    return params.blockSize;
  } else if(params && params.p && params.p.blockSize) {
    return params.p.blockSize;
  } else {
    return DEFAULT_BLOCK_SIZE;
  }
}
