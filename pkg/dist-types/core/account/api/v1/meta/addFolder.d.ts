import { NetQueue } from "../../../../../utils/netQueue";
import { FolderMeta } from "../../../folder-meta";
import { FolderEntryMeta } from "../../../folder-entry";
declare const addFolder: (metaQueue: NetQueue<FolderMeta>, meta: FolderMeta, folder: FolderEntryMeta) => FolderMeta;
export { addFolder };
