export const serializeEncrypted = async (crypto, bytes, key) => {
    const v = await crypto.decrypt(key, bytes);
    const s = new TextDecoder("utf-8").decode(v);
    return JSON.parse(s);
};
