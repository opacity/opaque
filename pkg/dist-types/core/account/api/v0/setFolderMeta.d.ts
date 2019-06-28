import { MasterHandle } from "~/account";
import { FolderMeta } from "~/core/account/folder-meta";
declare const setFolderMeta: (masterHandle: MasterHandle, dir: string, folderMeta: FolderMeta) => Promise<void>;
export { setFolderMeta };
