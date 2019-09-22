import { MasterHandle } from "../../../../account";
import { FolderEntryMeta } from "../../folder-entry";
declare type RenameFolderArgs = {
    folder: FolderEntryMeta;
    name: string;
};
declare const renameFolder: (masterHandle: MasterHandle, dir: string, { folder, name }: RenameFolderArgs) => Promise<void>;
export { renameFolder, RenameFolderArgs };
