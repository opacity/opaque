import { getFolderMeta } from "./getFolderMeta";
import { createMetaQueue } from "./createMetaQueue";
import { cleanPath } from "../../../../utils/cleanPath";
const moveFile = async (masterHandle, dir, { file, to }) => {
    dir = cleanPath(dir);
    const meta = await getFolderMeta(masterHandle, dir).catch(console.warn), toMeta = await getFolderMeta(masterHandle, to).catch(console.warn);
    if (!meta)
        throw new Error("Folder does not exist");
    if (!toMeta)
        throw new Error("Can't move to folder that doesn't exist");
    const existingFile = meta.files.find(f => file === f || file.name === f.name);
    // file is no longer in the metadata
    if (!existingFile)
        throw new Error("File no longer exists");
    createMetaQueue(masterHandle, dir);
    createMetaQueue(masterHandle, to);
    masterHandle.metaQueue[dir].push({
        type: "remove-file",
        payload: existingFile
    });
    masterHandle.metaQueue[to].push({
        type: "add-file",
        payload: existingFile
    });
};
export { moveFile };
