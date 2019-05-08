declare class AccountMeta {
    planSize: number;
    paidUntil: number;
    preferences: {
        [key: string]: AccountPreferences;
    };
    constructor({ planSize, paidUntil, preferences }: {
        planSize: number;
        paidUntil: number;
        preferences?: {
            [key: string]: AccountPreferences;
        };
    });
    setPreference(key: string, preference: AccountPreferences): void;
}
declare class AccountPreferences {
    constructor(obj: {
        [key: string]: any;
    });
}
/**
 * a metadata class to describe a file as it relates to the UI
 */
declare class FileEntryMeta {
    /** the name of the file as shown in the UI */
    name: string;
    /** the date in `ms` that this file was initially updated */
    created: number;
    /** if the file should be hidden (this could also be automatically generated within the UI, ie. `.files`) */
    hidden: boolean;
    /**
     * if the file is encrypted
     * (will require password in the UI, may need bytes prefixed to meta to determine whether it was encrypted)
     */
    locked: boolean;
    /** versions of the uploaded file (the most recent of which should be the current version of the file) */
    versions: FileVersion[];
    /** tags assigned to the file for organization/searching */
    tags: string[];
    /**
     * create metadata for a file entry in the UI
     *
     * @param name - the name of the file as shown in the UI
     * @param created - the date in `ms` that this file was initially updated
     * @param hidden - if the file should be hidden (this could also be automatically generated within the UI, ie. `.files`)
     * @param locked - if the file is encrypted
       *   (will require password in the UI, may need bytes prefixed to meta to determine whether it was encrypted)
     * @param versions - versions of the uploaded file (the most recent of which should be the current version of the file)
     * @param tags - tags assigned to the file for organization/searching
     */
    constructor({ name, created, hidden, locked, versions, tags }: {
        name: string;
        created?: number;
        hidden?: boolean;
        locked?: boolean;
        versions?: FileVersion[];
        tags?: string[];
    });
}
/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */
declare class FileVersion {
    /** size in bytes of the file */
    size: number;
    /** location on the network of the file */
    location: string;
    /**
     * a hash of the file
     * NOTE: probably `sha1`
     */
    hash: string;
    /** the date in `ms` that this version of the file was originally changed */
    modified: number;
    /**
     * create metadata for a file version
     *
     * @param size - size in bytes of the file
     * @param location - location on the network of the file
     * @param hash - a hash of the file
       *   NOTE: probably `sha1`
     * @param modified - the date in `ms` that this version of the file was originally changed
     */
    constructor({ size, location, hash, modified }: {
        size: number;
        location: string;
        hash: string;
        modified?: number;
    });
}
/**
 * a metadata class to describe where a folder can be found (for root metadata of an account)
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
}
/**
 * a metadata class to describe a folder for the UI
 */
declare class FolderMeta {
    /** a nickname shown on the folder when accessed without adding to account metadata */
    name: string;
    /** the files included only in the most shallow part of the folder */
    files: FileEntryMeta[];
    /** when the folder was created (if not created now) in `ms` */
    created: number;
    /** if the folder should be hidden (this could also be automatically generated within the UI, ie. `.folders`) */
    hidden: boolean;
    /**
     * if the folder's metadata is encrypted
     * (will require password in the UI, may need bytes prefixed to meta to determine whether it was encrypted)
     */
    locked: boolean;
    /** tags assigned to the folder for organization/searching */
    tags: string[];
    /**
     * create metadata for a folder
     *
     * @param name - a nickname shown on the folder when accessed without adding to account metadata
     * @param files - the files included only in the most shallow part of the folder
     * @param created - when the folder was created (if not created now) in `ms`
     * @param hidden - if the folder should be hidden (this could also be automatically generated within the UI)
     * @param locked - if the folder's metadata is encrypted (will require password in the UI)
     *  NOTE: may need bytes prefixed to meta to determine whether it was encrypted
     * @param tags - tags assigned to the folder for organization/searching
     */
    constructor({ name, files, created, hidden, locked, tags }: {
        name: string;
        files?: FileEntryMeta[];
        created: number;
        hidden?: boolean;
        locked?: boolean;
        tags?: string[];
    });
}
export { AccountMeta, AccountPreferences, FileEntryMeta, FileVersion, FolderEntryMeta, FolderMeta };
