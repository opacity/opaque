
import ForgeCipher from "node-forge/lib/cipher";
import ForgeMd from "node-forge/lib/md";
import ForgeUtil from "node-forge/lib/util";
import ForgeRandom from "node-forge/lib/random";
import { IV_BYTE_LENGTH, TAG_BYTE_LENGTH, TAG_BIT_LENGTH, BLOCK_OVERHEAD } from "./constants";

const Forge = { cipher: ForgeCipher, md: ForgeMd, util: ForgeUtil, random: ForgeRandom };
const ByteBuffer = Forge.util.ByteBuffer;

// Encryption
export function encrypt(key, byteBuffer) {
  key.read = 0;
  const iv = Forge.random.getBytesSync(IV_BYTE_LENGTH);
  const cipher = Forge.cipher.createCipher("AES-GCM", key);

  cipher.start({
    iv,
    tagLength: TAG_BIT_LENGTH
  });

  cipher.update(byteBuffer);
  cipher.finish();

  byteBuffer.clear();
  byteBuffer.putBuffer(cipher.output);
  byteBuffer.putBuffer(cipher.mode.tag);
  byteBuffer.putBytes(iv);

  return byteBuffer;
}

export function encryptString(key, string, encoding) {
  const buf = Forge.util.createBuffer(string, encoding || "utf8");
  return encrypt(key, buf);
}

export function encryptBytes(key, bytes) {
  return encrypt(key, Forge.util.createBuffer(bytes));
}

// Decryption
export function decrypt(key, byteBuffer) {
  key.read = 0;
  byteBuffer.read = byteBuffer.length() - BLOCK_OVERHEAD;

  const tag = byteBuffer.getBytes(TAG_BYTE_LENGTH);
  const iv = byteBuffer.getBytes(IV_BYTE_LENGTH);
  const decipher = Forge.cipher.createDecipher("AES-GCM", key);

  byteBuffer.read = 0;
  byteBuffer.truncate(BLOCK_OVERHEAD);
  decipher.start({
    iv,
    tag,
    tagLength: TAG_BIT_LENGTH
  });
  decipher.update(byteBuffer);

  if (decipher.finish()) {
    return decipher.output;
  } else {
    return false;
  }
}

export function decryptBytes(key, bytes) {
  const buf = new ByteBuffer(bytes);
  const output = decrypt(key, buf);
  if (output) {
    return Forge.util.binary.raw.decode(output.getBytes());
  } else {
    return false;
  }
}

export function decryptString(key, byteBuffer, encoding) {
  const output = decrypt(key, byteBuffer);
  if (output) {
    return output.toString(encoding || "utf8");
  } else {
    return false;
  }
}

export function decryptMetadata(key, data) {
  const byteBuffer = Forge.util.createBuffer(byteStr, "binary");
  const metadata = JSON.parse(decryptString(key, byteBuffer.compact()));

  return { version, metadata };
}

export function versionTrytes() {
  const typedVersion = new DataView(new ArrayBuffer(4));
  typedVersion.setUint32(0, CURRENT_VERSION);
  return typedVersion;
}

export const validateKeys = (obj, keys) => {
  // TODO: Smarter validation.
  const invalidKeys = keys.filter(key => !obj.hasOwnProperty(key));

  if (invalidKeys.length > 0) {
    throw `Missing required keys: ${invalidKeys.join(", ")}`;
  }
};
