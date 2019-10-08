import { hash } from "../../../hashing";
import { encryptString } from "../../../encryption";
import { setMetadata } from "../../../requests/metadata";
import { cleanPath } from "../../../../utils/cleanPath";
const setFolderMeta = async (masterHandle, dir, folderMeta) => {
    dir = cleanPath(dir);
    const folderKey = masterHandle.getFolderHDKey(dir), key = hash(folderKey.privateKey.toString("hex")), metaString = JSON.stringify(folderMeta.minify()), encryptedMeta = Buffer.from(encryptString(key, metaString, "utf8").toHex(), "hex").toString("base64");
    // TODO: verify folder can only be changed by the creating account
    await setMetadata(masterHandle.uploadOpts.endpoint, masterHandle, 
    // masterHandle.getFolderHDKey(dir),
    masterHandle.getFolderLocation(dir), encryptedMeta);
};
export { setFolderMeta };
