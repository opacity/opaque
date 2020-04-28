import { MasterHandle } from "../../../../account";
import { FolderMeta } from "../../../../core/account/folder-meta";
declare const getFolderMetaHistory: (masterHandle: MasterHandle, dir: string) => Promise<(Error | FolderMeta)[]>;
export { getFolderMetaHistory };
