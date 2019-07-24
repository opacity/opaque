import { MasterHandle } from "../../../../account";
import { FolderMeta } from "../../../../core/account/folder-meta";
declare const getFolderMeta: (masterHandle: MasterHandle, dir: string) => Promise<FolderMeta>;
export { getFolderMeta };
