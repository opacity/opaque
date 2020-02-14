import { MasterHandle } from "../../../../account";
import { FolderMeta } from "../../folder-meta";
declare const buildFullTree: (masterHandle: MasterHandle, dir?: string) => Promise<{
    [key: string]: FolderMeta;
}>;
export { buildFullTree };
