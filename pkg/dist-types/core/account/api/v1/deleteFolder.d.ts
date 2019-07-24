import { MasterHandle } from "../../../../account";
import { FolderEntryMeta } from "../../folder-entry";
declare const deleteFolder: (masterHandle: MasterHandle, dir: string, folder: FolderEntryMeta) => Promise<void>;
export { deleteFolder };
