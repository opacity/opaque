import { FileEntryMeta } from "./file-entry";
import { FolderEntryMeta } from "./folder-entry";
/**
 * a metadata class to describe a folder for the UI
 */
declare class FolderMeta {
    /** a nickname shown on the folder when accessed without adding to account metadata */
    name: string;
    /** the files included only in the most shallow part of the folder */
    files: (FileEntryMeta | FolderEntryMeta)[];
    /** when the folder was created (if not created now) in `ms` */
    created: number;
    /** if the folder should be hidden (this could also be automatically generated within the UI, ie. `.folders`) */
    hidden: boolean;
    /**
     * if the folder's metadata is encrypted
     * (will require password in the UI, may need bytes prefixed to meta to determine whether it was encrypted)
     */
    locked: boolean;
    /** tags assigned to the folder for organization/searching */
    tags: string[];
    /**
     * create metadata for a folder
     *
     * @param name - a nickname shown on the folder when accessed without adding to account metadata
     * @param files - the files included only in the most shallow part of the folder
     * @param created - when the folder was created (if not created now) in `ms`
     * @param hidden - if the folder should be hidden (this could also be automatically generated within the UI)
     * @param locked - if the folder's metadata is encrypted (will require password in the UI)
     *  NOTE: may need bytes prefixed to meta to determine whether it was encrypted
     * @param tags - tags assigned to the folder for organization/searching
     */
    constructor({ name, files, created, hidden, locked, tags }: {
        name: string;
        files?: (FileEntryMeta | FolderEntryMeta)[];
        created: number;
        hidden?: boolean;
        locked?: boolean;
        tags?: string[];
    });
}
export { FolderMeta };
