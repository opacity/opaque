import { MasterHandle } from "../../../../account";
import { FileEntryMeta } from "../../file-entry";
declare type RenameFileArgs = {
    file: FileEntryMeta;
    name: string;
};
declare const renameFile: (masterHandle: MasterHandle, dir: string, { file, name }: RenameFileArgs) => Promise<void>;
export { renameFile, RenameFileArgs };
