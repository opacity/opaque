import { getFolderMeta } from "./getFolderMeta";
import { deleteVersion } from "./deleteVersion";
import { createMetaQueue } from "./createMetaQueue";
import { cleanPath } from "../../../../utils/cleanPath";
const deleteFile = async (masterHandle, dir, file) => {
    dir = cleanPath(dir);
    const meta = await getFolderMeta(masterHandle, dir);
    const existingFile = meta.files.find(f => file === f || file.name === f.name);
    // precondition for if file is no longer in the metadata
    if (!existingFile)
        return;
    for (let version of existingFile.versions) {
        await deleteVersion(masterHandle, dir, version);
    }
    createMetaQueue(masterHandle, dir);
    masterHandle.metaQueue[dir].push({
        type: "remove-file",
        payload: existingFile
    });
};
export { deleteFile };
