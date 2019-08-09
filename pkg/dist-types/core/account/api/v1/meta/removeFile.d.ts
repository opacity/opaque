import { NetQueue } from "../../../../../utils/netQueue";
import { FileEntryMeta } from "../../../file-entry";
import { FolderMeta } from "../../../folder-meta";
declare const removeFile: (metaQueue: NetQueue<FolderMeta>, meta: FolderMeta, file: FileEntryMeta) => Promise<FolderMeta>;
export { removeFile };
