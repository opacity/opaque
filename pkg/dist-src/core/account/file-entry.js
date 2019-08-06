import { FileVersion, MinifiedFileVersion } from "./file-version";
/**
 * metadata to describe a file as it relates to the UI
 *
 * @public
 */
class FileEntryMeta {
    /**
     * create metadata for a file entry in the UI
     *
     * @param name - the name of the file as shown in the UI
     * @param created - the date in `ms` that this file was initially uploaded
     * @param created - the date in `ms` that the newest version of this file was uploaded
     * @param versions - versions of the uploaded file (the most recent of which should be the current version of the file)
     */
    constructor({ name, created = Date.now(), modified = Date.now(), versions = [] }) {
        /** @internal */
        this.minify = () => new MinifiedFileEntryMeta([
            this.name,
            this.created,
            this.modified,
            this.versions.map(version => new FileVersion(version).minify())
        ]);
        this.name = name;
        this.created = created;
        this.modified = modified;
        this.versions = versions;
    }
}
/**
 * @internal
 */
class MinifiedFileEntryMeta extends Array {
    constructor([name, created, modified, versions]) {
        super(4);
        this.unminify = () => new FileEntryMeta({
            name: this[0],
            created: this[1],
            modified: this[2],
            versions: this[3].map(version => new MinifiedFileVersion(version).unminify())
        });
        this[0] = name;
        this[1] = created;
        this[2] = modified;
        this[3] = versions;
    }
}
export { FileEntryMeta, MinifiedFileEntryMeta };
