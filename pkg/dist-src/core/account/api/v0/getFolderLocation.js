import { hash } from "../../../../core/hashing";
import { cleanPath } from "../../../../utils/cleanPath";
const getFolderLocation = (masterHandle, dir) => {
    dir = cleanPath(dir);
    return hash(masterHandle.getFolderHDKey(dir).publicKey.toString("hex"));
};
export { getFolderLocation };
