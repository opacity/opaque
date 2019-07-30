/**
 * metadata to describe where a folder can be found (for root metadata of an account)
 *
 * @public
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
        /** @internal */
        this.minify = () => new MinifiedFolderEntryMeta([
            this.name,
            this.location
        ]);
        this.name = name;
        this.location = location;
    }
}
/**
 * @internal
 */
class MinifiedFolderEntryMeta extends Array {
    constructor([name, location]) {
        super(2);
        this.unminify = () => new FolderEntryMeta({
            name: this[0],
            location: this[1]
        });
        this[0] = name;
        this[1] = location;
    }
}
export { FolderEntryMeta, MinifiedFolderEntryMeta };
