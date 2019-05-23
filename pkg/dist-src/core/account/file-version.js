/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */
class FileVersion {
    /**
     * create metadata for a file version
     *
     * @param size - size in bytes of the file
     * @param location - // DEPRECATED location on the network of the file
     * @param handle - the file handle
     * @param hash - a hash of the file
     *   NOTE: probably `sha1`
     * @param modified - the date in `ms` that this version of the file was originally changed
     */
    constructor({ size, 
    // location,
    handle, hash, modified = Date.now() }) {
        this.size = size;
        // this.location = location
        this.handle = handle;
        this.hash = hash;
        this.modified = modified;
    }
}
export { FileVersion };
