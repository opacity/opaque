import { FolderMeta } from "~/core/account/folder-meta";
const login = async (masterHandle) => {
    try {
        await masterHandle.getFolderMeta("/");
    }
    catch (err) {
        console.warn(err);
        masterHandle.createFolderMeta("/");
        masterHandle.setFolderMeta("/", new FolderMeta());
    }
};
export { login };
