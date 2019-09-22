import { MasterHandle } from "../../../../account";
import { FileEntryMeta } from "../../file-entry";
declare type MoveFileArgs = {
    file: FileEntryMeta;
    to: string;
};
declare const moveFile: (masterHandle: MasterHandle, dir: string, { file, to }: MoveFileArgs) => Promise<void>;
export { moveFile, MoveFileArgs };
