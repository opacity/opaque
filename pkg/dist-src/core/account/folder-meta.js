/**
 * a metadata class to describe a folder for the UI
 */
class FolderMeta {
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
    constructor({ name = "Folder", files = [], created = Date.now(), hidden = false, locked = false, tags = [] } = {}) {
        this.name = name;
        this.files = files;
        this.created = created;
        this.hidden = hidden;
        this.locked = locked;
        this.tags = tags;
    }
}
export { FolderMeta };
