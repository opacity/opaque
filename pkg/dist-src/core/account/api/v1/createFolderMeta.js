import { createMetadata } from "../../../../core/requests/metadata";
import { cleanPath } from "../../../../utils/cleanPath";
const createFolderMeta = async (masterHandle, dir) => {
    dir = cleanPath(dir);
    try {
        // TODO: verify folder can only be changed by the creating account
        await createMetadata(masterHandle.uploadOpts.endpoint, masterHandle, 
        // masterHandle.getFolderHDKey(dir),
        masterHandle.getFolderLocation(dir));
    }
    catch (err) {
        console.error(`Can't create folder metadata for folder ${dir}`);
        throw err;
    }
};
export { createFolderMeta };
