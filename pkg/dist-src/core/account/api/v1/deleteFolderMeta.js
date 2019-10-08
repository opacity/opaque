import { deleteMetadata } from "../../../../core/requests/metadata";
import { cleanPath } from "../../../../utils/cleanPath";
const deleteFolderMeta = async (masterHandle, dir) => {
    dir = cleanPath(dir);
    // TODO: verify folder can only be changed by the creating account
    await deleteMetadata(masterHandle.uploadOpts.endpoint, masterHandle, 
    // masterHandle.getFolderHDKey(dir),
    masterHandle.getFolderLocation(dir));
};
export { deleteFolderMeta };
