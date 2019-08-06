/**
 * metadata to describe a version of a file as it relates to a filesystem
 *
 * @public
 */
declare class FileVersion {
    /** the shareable handle of the file */
    handle: string;
    /** the size of the file in bytes */
    size: number;
    /** the date in `ms` that this version was uploaded */
    created: number;
    /** the date in `ms` that the filesystem marked as last modified */
    modified: number;
    /**
     * create metadata for a file version
     *
     * @param handle - the file handle
     * @param size - the size of the file in bytes
     * @param created - the date this version was uploaded
     * @param modified - the date the filesystem marked as last modified
     */
    constructor({ handle, size, created, modified }: {
        handle: string;
        size: number;
        created?: number;
        modified?: number;
    });
    /** @internal */
    minify: () => MinifiedFileVersion;
}
declare type MinifiedFileVersionProps = [
/** the shareable handle of the file */
string, 
/** the size of the file in bytes */
number, 
/** the date in `ms` that this version was uploaded */
number, 
/** the date in `ms` that the filesystem marked as last modified */
number];
/**
 * @internal
 */
declare class MinifiedFileVersion extends Array {
    constructor([handle, size, created, modified]: MinifiedFileVersionProps);
    unminify: () => FileVersion;
}
export { FileVersion, MinifiedFileVersion, MinifiedFileVersionProps };
