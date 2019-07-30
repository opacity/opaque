/**
 * metadata to describe a version of a file as it relates to a filesystem
 *
 * @public
 */
class FileVersion {
    /**
     * create metadata for a file version
     *
     * @param handle - the file handle
     * @param size - the size of the file in bytes
     * @param created - the date this version was uploaded
     * @param modified - the date the filesystem marked as last modified
     */
    constructor({ handle, size, created = Date.now(), modified = Date.now() }) {
        /** @internal */
        this.minify = () => new MinifiedFileVersion([
            this.handle,
            this.size,
            this.created,
            this.modified
        ]);
        this.handle = handle;
        this.size = size;
        this.created = created;
        this.modified = modified;
    }
}
/**
 * @internal
 */
class MinifiedFileVersion extends Array {
    constructor([handle, size, created, modified]) {
        super(4);
        this.unminify = () => new FileVersion({
            handle: this[0],
            size: this[1],
            created: this[2],
            modified: this[3]
        });
        this[0] = handle;
        this[1] = size;
        this[2] = created;
        this[3] = modified;
    }
}
export { FileVersion, MinifiedFileVersion };
