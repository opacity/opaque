import { cipher as ForgeCipher, md as ForgeMd, util as ForgeUtil, random as ForgeRandom } from "node-forge";
import { IV_BYTE_LENGTH, TAG_BYTE_LENGTH, TAG_BIT_LENGTH, BLOCK_OVERHEAD } from "./constants";
const Forge = { cipher: ForgeCipher, md: ForgeMd, util: ForgeUtil, random: ForgeRandom };
const ByteBuffer = Forge.util.ByteBuffer;
// Encryption
export function encrypt(key, byteBuffer) {
    const keyBuf = new ByteBuffer(Buffer.from(key, "hex"));
    const iv = Forge.random.getBytesSync(IV_BYTE_LENGTH);
    const cipher = Forge.cipher.createCipher("AES-GCM", keyBuf);
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
export function encryptString(key, string, encoding = "utf8") {
    const buf = Forge.util.createBuffer(string, encoding);
    return encrypt(key, buf);
}
export function encryptBytes(key, bytes) {
    return encrypt(key, Forge.util.createBuffer(bytes));
}
// Decryption
export function decrypt(key, byteBuffer) {
    const keyBuf = new ByteBuffer(Buffer.from(key, "hex"));
    keyBuf.read = 0;
    byteBuffer.read = byteBuffer.length() - BLOCK_OVERHEAD;
    const tag = byteBuffer.getBytes(TAG_BYTE_LENGTH);
    const iv = byteBuffer.getBytes(IV_BYTE_LENGTH);
    const decipher = Forge.cipher.createDecipher("AES-GCM", keyBuf);
    byteBuffer.read = 0;
    byteBuffer.truncate(BLOCK_OVERHEAD);
    decipher.start({
        iv,
        // the type definitions are wrong in @types/node-forge
        tag: tag,
        tagLength: TAG_BIT_LENGTH
    });
    decipher.update(byteBuffer);
    if (decipher.finish()) {
        return decipher.output;
    }
    else {
        return false;
    }
}
export function decryptBytes(key, bytes) {
    const buf = new ByteBuffer(bytes);
    const output = decrypt(key, buf);
    if (output) {
        return Forge.util.binary.raw.decode(output.getBytes());
    }
    else {
        return false;
    }
}
export function decryptString(key, byteBuffer, encoding = "utf8") {
    const output = decrypt(key, byteBuffer);
    if (output) {
        return Buffer.from(output.toString()).toString(encoding);
    }
    else {
        throw new Error("unable to decrypt");
    }
}
