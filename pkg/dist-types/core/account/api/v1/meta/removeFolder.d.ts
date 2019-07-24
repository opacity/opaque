import { NetQueue } from "../../../../../utils/netQueue";
import { FolderEntryMeta } from "../../../folder-entry";
import { FolderMeta } from "../../../folder-meta";
declare const removeFolder: (metaQueue: NetQueue<FolderMeta>, meta: FolderMeta, folder: FolderEntryMeta) => Promise<FolderMeta>;
export { removeFolder };
