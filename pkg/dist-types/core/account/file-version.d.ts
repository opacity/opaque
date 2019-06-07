/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */
declare class FileVersion {
    handle: string;
    /**
     * create metadata for a file version
     *
     * @param handle - the file handle
     */
    constructor({ handle }: {
        handle: string;
    });
    minify(): MinifiedFileVersion;
}
declare type MinifiedFileVersionProps = string;
declare class MinifiedFileVersion extends String {
    unminify(): FileVersion;
}
export { FileVersion, MinifiedFileVersion, MinifiedFileVersionProps };
