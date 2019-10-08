import { deleteFile as requestDeleteFile } from "../../../../core/requests/deleteFile";
import { createMetaQueue } from "./createMetaQueue";
import { cleanPath } from "../../../../utils/cleanPath";
const deleteVersion = async (masterHandle, dir, version) => {
    dir = cleanPath(dir);
    await requestDeleteFile(masterHandle.uploadOpts.endpoint, masterHandle, 
    // only send the location, not the private key
    version.handle.slice(0, 64)).catch(err => {
        console.warn("version does not exist");
        console.warn(err);
    });
    createMetaQueue(masterHandle, dir);
    masterHandle.metaQueue[dir].push({
        type: "remove-version",
        payload: version
    });
};
export { deleteVersion };
