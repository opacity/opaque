import { FileEntryMeta, MinifiedFileEntryMeta } from "./file-entry";
import { FolderEntryMeta, MinifiedFolderEntryMeta } from "./folder-entry";
/**
 * metadata to describe a folder for the UI
 *
 * @public
 */
class FolderMeta {
    /**
     * create metadata for a folder
     *
     * @param name - a nickname shown on the folder when accessed without adding to account metadata
     * @param files - the files included only in the most shallow part of the folder
     * @param created - when the folder was created (if not created now) in `ms`
     * @param created - when the folder was changed (if not modified now) in `ms`
     */
    constructor({ name = "Folder", files = [], folders = [], created = Date.now(), modified = Date.now() } = {}) {
        /** @internal */
        this.minify = () => new MinifiedFolderMeta([
            this.name,
            this.files.map(file => new FileEntryMeta(file).minify()),
            this.folders.map(folder => new FolderEntryMeta(folder).minify()),
            this.created,
            this.modified
        ]);
        this.name = name;
        this.files = files;
        this.folders = folders;
        this.created = created;
        this.modified = modified;
    }
}
/**
 * @internal
 */
class MinifiedFolderMeta extends Array {
    constructor([name, files, folders, created, modified]) {
        super(5);
        this.unminify = () => new FolderMeta({
            name: this[0],
            files: this[1].map(file => new MinifiedFileEntryMeta(file).unminify()),
            folders: this[2].map(folder => new MinifiedFolderEntryMeta(folder).unminify()),
            created: this[3],
            modified: this[4]
        });
        this[0] = name;
        this[1] = files;
        this[2] = folders;
        this[3] = created;
        this[4] = modified;
    }
}
export { FolderMeta, MinifiedFolderMeta };
