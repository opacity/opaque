import { MasterHandle } from "../../../../account";
import { FolderEntryMeta } from "../../folder-entry";
declare type MoveFolderArgs = {
    folder: FolderEntryMeta;
    to: string;
};
declare const moveFolder: (masterHandle: MasterHandle, dir: string, { folder, to }: MoveFolderArgs) => Promise<void>;
export { moveFolder, MoveFolderArgs };
