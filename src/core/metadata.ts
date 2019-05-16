import { sanitizeFilename, FileData } from "./helpers";
import { encryptString, decryptString } from "./encryption";
import { util as ForgeUtil } from "node-forge";

const Forge = { util: ForgeUtil };

const PROTOCOL_VERSION = 1;

export type FileMetaOptions = {
  blockSize?: number
  chunkSize?: number
}

export type FileMeta = {
  name: string
  type: string
  size: number
  p: FileMetaOptions
}

export function createMetadata (file: FileData, opts: FileMetaOptions) {
  const filename = sanitizeFilename(file.name);

  const metadata: FileMeta = {
    name: filename,
    type: file.type,
    size: file.size,
    p: opts
  }

  return metadata;
}

export function encryptMetadata (metadata: FileMeta, key: string) {
  const encryptedMeta = encryptString(key, JSON.stringify(metadata), "utf8");
  return Forge.util.binary.raw.decode(encryptedMeta.getBytes());
}

export function decryptMetadata (data: Uint8Array, key: string) {
  const byteStr = Forge.util.binary.raw.encode(data);
  const byteBuffer = new Forge.util.ByteBuffer(byteStr);
  const meta: FileMeta = JSON.parse(decryptString(key, byteBuffer));

  return meta;
}
