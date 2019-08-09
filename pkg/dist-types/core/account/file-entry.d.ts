import { FileVersion, MinifiedFileVersion } from "./file-version";
/**
 * metadata to describe a file as it relates to the UI
 *
 * @public
 */
declare class FileEntryMeta {
    /** the name of the file as shown in the UI */
    name: string;
    /** the date in `ms` that this file was initially uploaded */
    created: number;
    /** the date in `ms` that the newest version of this file was uploaded */
    modified: number;
    /** versions of the uploaded file (the most recent of which should be the current version of the file) */
    versions: FileVersion[];
    /**
     * create metadata for a file entry in the UI
     *
     * @param name - the name of the file as shown in the UI
     * @param created - the date in `ms` that this file was initially uploaded
     * @param created - the date in `ms` that the newest version of this file was uploaded
     * @param versions - versions of the uploaded file (the most recent of which should be the current version of the file)
     */
    constructor({ name, created, modified, versions }: {
        name: string;
        created?: number;
        modified?: number;
        versions?: FileVersion[];
    });
    /** @internal */
    minify: () => MinifiedFileEntryMeta;
}
declare type MinifiedFileEntryMetaProps = [string, number, number, MinifiedFileVersion[]];
/**
 * @internal
 */
declare class MinifiedFileEntryMeta extends Array {
    /** the name of the file as shown in the UI */
    0: string;
    /** the date in `ms` that this file was initially uploaded */
    1: number;
    /** the date in `ms` that the newest version of this file was uploaded */
    2: number;
    /** versions of the uploaded file (the most recent of which should be the current version of the file) */
    3: MinifiedFileVersion[];
    constructor([name, created, modified, versions]: MinifiedFileEntryMetaProps);
    unminify: () => FileEntryMeta;
}
export { FileEntryMeta, MinifiedFileEntryMeta, MinifiedFileEntryMetaProps };
