import { NetQueue } from "../../../../../utils/netQueue";
import { FolderMeta } from "../../../folder-meta";
import { FileEntryMeta } from "../../../file-entry";
declare const addFile: (metaQueue: NetQueue<FolderMeta>, meta: FolderMeta, file: FileEntryMeta) => FolderMeta;
export { addFile };
