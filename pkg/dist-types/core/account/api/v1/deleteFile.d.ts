import { MasterHandle } from "../../../../account";
import { FileEntryMeta } from "../../file-entry";
declare const deleteFile: (masterHandle: MasterHandle, dir: string, file: FileEntryMeta) => Promise<void>;
export { deleteFile };
