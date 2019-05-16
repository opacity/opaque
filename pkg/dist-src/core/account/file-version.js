/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */
class FileVersion {
    /**
     * create metadata for a file version
     *
     * @param size - size in bytes of the file
     * @param location - location on the network of the file
     * @param hash - a hash of the file
     *   NOTE: probably `sha1`
     * @param modified - the date in `ms` that this version of the file was originally changed
     */
    constructor({ size, location, hash, modified = Date.now() }) {
        this.size = size;
        this.location = location;
        this.hash = hash;
        this.modified = modified;
    }
}
export { FileVersion };
