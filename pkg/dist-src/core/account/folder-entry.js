/**
 * a metadata class to describe where a folder can be found (for root metadata of an account)
 */
class FolderEntryMeta {
    /**
     * create metadata entry for a folder
     *
     * @param name - a name of the folder shown in the UI
     * @param location - the public key for the metadata file
     *   it is how the file will be queried for (using the same system as for the account metadata)
     */
    constructor({ name, location }) {
        this.type = "folder";
        this.name = name;
        this.location = location;
    }
}
export { FolderEntryMeta };
