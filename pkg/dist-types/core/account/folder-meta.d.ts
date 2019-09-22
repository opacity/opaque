import { FileEntryMeta, MinifiedFileEntryMeta } from "./file-entry";
import { FolderEntryMeta, MinifiedFolderEntryMeta } from "./folder-entry";
/**
 * metadata to describe a folder for the UI
 *
 * @public
 */
declare class FolderMeta {
    /** a nickname shown on the folder when accessed without adding to account metadata */
    name: string;
    /** the files included only in the most shallow part of the folder */
    files: FileEntryMeta[];
    /** the folders included only in the most shallow part of the folder */
    folders: FolderEntryMeta[];
    /** when the folder was created (if not created now) in `ms` */
    created: number;
    /** when the folder was changed (if not modified now) in `ms` */
    modified: number;
    /**
     * create metadata for a folder
     *
     * @param name - a nickname shown on the folder when accessed without adding to account metadata
     * @param files - the files included only in the most shallow part of the folder
     * @param created - when the folder was created (if not created now) in `ms`
     * @param created - when the folder was changed (if not modified now) in `ms`
     */
    constructor({ name, files, folders, created, modified }?: {
        name?: string;
        files?: FileEntryMeta[];
        folders?: FolderEntryMeta[];
        created?: number;
        modified?: number;
    });
    /** @internal */
    minify: () => MinifiedFolderMeta;
}
declare type MinifiedFolderMetaProps = [string, MinifiedFileEntryMeta[], MinifiedFolderEntryMeta[], number, number];
/**
 * @internal
 */
declare class MinifiedFolderMeta extends Array {
    /** a nickname shown on the folder when accessed without adding to account metadata */
    0: string;
    /** the files included only in the most shallow part of the folder */
    1: MinifiedFileEntryMeta[];
    /** the folders included only in the most shallow part of the folder */
    2: MinifiedFolderEntryMeta[];
    /** when the folder was created (if not created now) in `ms` */
    3: number;
    /** when the folder was changed (if not modified now) in `ms` */
    4: number;
    constructor([name, files, folders, created, modified]: MinifiedFolderMetaProps);
    unminify: () => FolderMeta;
}
export { FolderMeta, MinifiedFolderMeta, MinifiedFolderMetaProps };
