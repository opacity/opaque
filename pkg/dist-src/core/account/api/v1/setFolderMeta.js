import { hash } from "../../../../core/hashing";
import { encryptString } from "../../../../core/encryption";
import { setMetadata } from "../../../../core/requests/metadata";
const setFolderMeta = async (masterHandle, dir, folderMeta) => {
    const folderKey = masterHandle.getFolderHDKey(dir), key = hash(folderKey.privateKey.toString("hex")), metaString = JSON.stringify(folderMeta), encryptedMeta = encryptString(key, metaString, "utf8").toHex();
    // TODO: verify folder can only be changed by the creating account
    await setMetadata(masterHandle.uploadOpts.endpoint, masterHandle, 
    // masterHandle.getFolderHDKey(dir),
    masterHandle.getFolderLocation(dir), encryptedMeta);
};
export { setFolderMeta };
