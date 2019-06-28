import { hash } from "~/core/hashing";
import { encryptString } from "~/core/encryption";
import { setMetadata } from "~/core/requests/metadata";
const setFolderMeta = async (masterHandle, dir, folderMeta) => {
    const folderKey = masterHandle.getFolderHDKey(dir), key = hash(folderKey.privateKey.toString("hex")), metaString = JSON.stringify(folderMeta.minify()), encryptedMeta = Buffer.from(encryptString(key, metaString, "utf8").toHex(), "hex").toString("base64");
    // TODO: verify folder can only be changed by the creating account
    await setMetadata(masterHandle.uploadOpts.endpoint, masterHandle, 
    // masterHandle.getFolderHDKey(dir),
    masterHandle.getFolderLocation(dir), encryptedMeta);
};
export { setFolderMeta };
