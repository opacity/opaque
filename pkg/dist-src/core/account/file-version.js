/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */
class FileVersion {
    /**
     * create metadata for a file version
     *
     * @param handle - the file handle
     */
    constructor({ handle }) {
        this.handle = handle;
    }
    minify() {
        return new MinifiedFileVersion(this.handle);
    }
}
class MinifiedFileVersion extends String {
    unminify() {
        return new FileVersion({
            handle: this.toString()
        });
    }
}
export { FileVersion, MinifiedFileVersion };
