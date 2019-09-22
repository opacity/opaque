/**
 * metadata to describe where a folder can be found (for root metadata of an account)
 *
 * @public
 */
declare class FolderEntryMeta {
    /** a name of the folder shown in the UI */
    name: string;
    /**
     * the public key for the metadata file
     * it is how the file will be queried for (using the same system as for the account metadata)
     */
    location: string;
    /**
     * create metadata entry for a folder
     *
     * @param name - a name of the folder shown in the UI
     * @param location - the public key for the metadata file
     *   it is how the file will be queried for (using the same system as for the account metadata)
     */
    constructor({ name, location }: {
        name: string;
        location: string;
    });
    /** @internal */
    minify: () => MinifiedFolderEntryMeta;
}
declare type MinifiedFolderEntryMetaProps = [string, string];
/**
 * @internal
 */
declare class MinifiedFolderEntryMeta extends Array {
    /** a name of the folder shown in the UI */
    0: string;
    /**
     * the public key for the metadata file
     * it is how the file will be queried for (using the same system as for the account metadata)
     */
    1: string;
    constructor([name, location]: MinifiedFolderEntryMetaProps);
    unminify: () => FolderEntryMeta;
}
export { FolderEntryMeta, MinifiedFolderEntryMeta, MinifiedFolderEntryMetaProps };
