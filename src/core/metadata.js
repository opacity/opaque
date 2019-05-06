import { sanitizeFilename } from "./helpers";
import { encryptString, decryptString } from "./encryption";
import ForgeUtil from "node-forge/lib/util";

const Forge = { util: ForgeUtil };

const PROTOCOL_VERSION = 1;

export function createMetadata (file, opts) {
  const filename = sanitizeFilename(file.name);

  const metadata = {
    name: filename,
    type: file.type,
    size: file.size,
    p: {
      blockSize: opts.blockSize,
      chunkSize: opts.chunkSize
    }
  }

  return metadata;
}

export function encryptMetadata (metadata, key) {
  const encryptedMeta = encryptString(key, JSON.stringify(metadata), "utf8");
  return Forge.util.binary.raw.decode(encryptedMeta.getBytes());
}

export function decryptMetadata (data, key) {
  const byteStr = Forge.util.binary.raw.encode(new Uint8Array(data));
  const byteBuffer = Forge.util.createBuffer(byteStr, "binary");
  const meta = JSON.parse(decryptString(key, byteBuffer));

  return meta;
}
