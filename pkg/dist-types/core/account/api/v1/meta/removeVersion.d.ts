import { NetQueue } from "../../../../../utils/netQueue";
import { FolderMeta } from "../../../metadata";
import { FileVersion } from "../../../file-version";
declare const removeVersion: (metaQueue: NetQueue<FolderMeta>, meta: FolderMeta, version: FileVersion) => Promise<FolderMeta>;
export { removeVersion };
