/// <reference types="node" />
import { Buffer } from 'safe-buffer';
import { EventEmitter } from 'events';
import FormDataNode from 'form-data';
import HDKey from 'hdkey';
import { Readable } from 'readable-stream';
import { Transform } from 'readable-stream';
import { Writable } from 'readable-stream';

/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for representing the account mnemonic
 *
 * @public
 */
export declare class Account {
    private _mnemonic;
    readonly mnemonic: string[];
    /**
     * creates an account from a mnemonic if provided, otherwise from entropy
     *
     * @param mnemonic - the mnemonic to use for the account
     */
    constructor(mnemonic?: string);
    readonly seed: Buffer;
}

declare class BufferSourceStream extends Readable {
    offset: any;
    options: any;
    buffer: any;
    constructor(data: any, options: any);
    _read(): void;
    _readChunkFromBuffer(): any;
}

/* Excluded from this release type: checkPaymentStatus */

/* Excluded from this release type: createAccount */

/* Excluded from this release type: createMetadata */

declare class DecryptStream extends Transform {
    options: any;
    blockSize: any;
    key: any;
    iter: any;
    constructor(key: any, options?: any);
    _transform(chunk: any, encoding: any, callback: any): void;
}

/* Excluded from this release type: deleteMetadata */

/* Excluded from this release type: Download */

declare type DownloadOptions = {
    autoStart?: boolean;
    endpoint?: string;
};

declare class DownloadStream extends Readable {
    options: any;
    url: any;
    size: any;
    metadata: any;
    chunks: any;
    chunkId: any;
    pushId: any;
    bytesDownloaded: any;
    isDownloadFinished: any;
    ongoingDownloads: any;
    pushChunk: any;
    constructor(url: any, metadata: any, size: any, options?: {});
    _read(): void;
    _download(chunkIndex?: any): Promise<void>;
    _afterDownload(): Promise<void>;
    _pushChunk(): void;
}

declare class EncryptStream extends Transform {
    options: any;
    key: any;
    constructor(key: any, options: any);
    _transform(data: any, encoding: any, callback: any): void;
}

declare type FileData = {
    data: Buffer;
    size: number;
    name: string;
    type: string;
    reader: typeof Readable | typeof BufferSourceStream | typeof FileSourceStream;
};

/**
 * metadata to describe a file as it relates to the UI
 *
 * @public
 */
export declare class FileEntryMeta {
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
    /* Excluded from this release type: minify */
}

declare type FileMeta = {
    name: string;
    type: string;
    size: number;
    p: FileMetaOptions;
};

declare type FileMetaOptions = {
    blockSize?: number;
    chunkSize?: number;
};

declare class FileSourceStream extends Readable {
    offset: any;
    options: any;
    blob: any;
    reader: any;
    constructor(blob: any, options: any);
    _read(): void;
    _readChunkFromBlob(): boolean;
    _onChunkRead(event: any): void;
}

/**
 * metadata to describe a version of a file as it relates to a filesystem
 *
 * @public
 */
export declare class FileVersion {
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
    /* Excluded from this release type: minify */
}

/**
 * metadata to describe where a folder can be found (for root metadata of an account)
 *
 * @public
 */
export declare class FolderEntryMeta {
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
    /* Excluded from this release type: minify */
}

/**
 * metadata to describe a folder for the UI
 *
 * @public
 */
export declare class FolderMeta {
    /** a nickname shown on the folder when accessed without adding to account metadata */
    name: string;
    /** the files included only in the most shallow part of the folder */
    files: FileEntryMeta[];
    /** the folders included only in the most shallow part of the folder */
    folders: FolderEntryMeta[];
    /** when the folder was created (if not created now) in `ms` */
    created: number;
    /** when the folder was changed (if not modified now) in `ms` */
    modified: number;
    /**
     * create metadata for a folder
     *
     * @param name - a nickname shown on the folder when accessed without adding to account metadata
     * @param files - the files included only in the most shallow part of the folder
     * @param created - when the folder was created (if not created now) in `ms`
     * @param created - when the folder was changed (if not modified now) in `ms`
     */
    constructor({ name, files, folders, created, modified }?: {
        name?: string;
        files?: FileEntryMeta[];
        folders?: FolderEntryMeta[];
        created?: number;
        modified?: number;
    });
    /* Excluded from this release type: minify */
}

/* Excluded from this release type: getMetadata */

/* Excluded from this release type: getPayload */

/* Excluded from this release type: getPayloadFD */

/* Excluded from this release type: getPlans */
export { HDKey }

/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for creating a master handle from an account mnemonic
 *
 * @remarks
 *
 * a master handle is responsible for:
 *  <br /> - logging in to an account
 *  <br /> - signing changes for the account
 *  <br /> - deterministic entropy for generating features of an account (such as folder keys)
 *
 * @public
 */
export declare class MasterHandle extends HDKey {
    uploadOpts: any;
    downloadOpts: any;
    metaQueue: {
        [key: string]: NetQueue<FolderMeta>;
    };
    metaFolderCreating: {
        [key: string]: boolean;
    };
    /**
     * creates a master handle from an account
     *
     * @param _ - the account to generate the handle from
     * @param _.account - an {@link Account}
     * @param _.handle - an account handle as a string
     */
    constructor({ account, handle, }: MasterHandleCreator, { uploadOpts, downloadOpts }?: MasterHandleOptions);
    /**
     * get the account handle
     */
    readonly handle: string;
    /**
     * creates a sub key seed for validating
     *
     * @param path - the string to use as a sub path
     */
    private generateSubHDKey;
    uploadFile: (dir: string, file: File) => import("events").EventEmitter;
    downloadFile: (handle: string) => import("./download").default;
    /**
     * deletes every version of a file and removes it from the metadata
     *
     * @param dir - the containing folder
     * @param file - file entry to delete (loosely matched name)
     */
    deleteFile: (dir: string, file: FileEntryMeta) => Promise<void>;
    /**
     * deletes a single version of a file (ie. delete by handle)
     *
     * @param dir - the containing folder
     * @param version - version to delete (loosely matched by handle)
     */
    deleteVersion: (dir: string, version: FileVersion) => Promise<void>;
    /**
     * creates a dir key seed for validating and folder navigation
     *
     * @param dir - the folder
     */
    getFolderHDKey: (dir: string) => HDKey;
    /**
     * get the location (ie. metadata id) of a folder
     *
     * @remarks this is a deterministic location derived from the account's hdkey to allow for random folder access
     *
     * @param dir - the folder to locate
     */
    getFolderLocation: (dir: string) => string;
    /**
     * request the creation of a folder metadata
     *
     * @param dir - the folder to create
     */
    createFolderMeta: (dir: string) => Promise<void>;
    /**
     * create folder {name} inside of {dir}
     *
     * @param dir - the containing folder
     * @param name - the name of the new folder
     */
    createFolder: (dir: string, name: string) => Promise<void>;
    deleteFolderMeta: (dir: string) => Promise<void>;
    deleteFolder: (dir: string, folder: FolderEntryMeta) => Promise<void>;
    moveFile: (dir: string, { file, to }: MoveFileArgs) => Promise<void>;
    moveFolder: (dir: string, { folder, to }: MoveFolderArgs) => Promise<void>;
    renameFile: (dir: string, { file, name }: RenameFileArgs) => Promise<void>;
    renameFolder: (dir: string, { folder, name }: RenameFolderArgs) => Promise<void>;
    setFolderMeta: (dir: string, folderMeta: FolderMeta) => Promise<void>;
    getFolderMeta: (dir: string) => Promise<FolderMeta>;
    /**
     * recursively build full file tree starting from directory {dir}
     *
     * @param dir - the starting directory
     */
    buildFullTree: (dir: string) => Promise<{
        [dir: string]: FolderMeta;
    }>;
    getAccountInfo: () => Promise<any>;
    isPaid: () => Promise<boolean>;
    login: () => Promise<void>;
    register: (duration?: number, limit?: number) => Promise<{
        data: any;
        waitForPayment: () => Promise<unknown>;
    }>;
}

export declare type MasterHandleCreator = RequireOnlyOne<{
    account: Account;
    handle: string;
}, "account" | "handle">;

export declare type MasterHandleOptions = {
    uploadOpts?: any;
    downloadOpts?: any;
};

/* Excluded from this release type: MinifiedFileEntryMeta */

declare type MinifiedFileEntryMetaProps = [string, number, number, MinifiedFileVersion[]];

/* Excluded from this release type: MinifiedFileVersion */

declare type MinifiedFileVersionProps = [
/** the shareable handle of the file */
string, 
/** the size of the file in bytes */
number, 
/** the date in `ms` that this version was uploaded */
number, 
/** the date in `ms` that the filesystem marked as last modified */
number];

/* Excluded from this release type: MinifiedFolderEntryMeta */

declare type MinifiedFolderEntryMetaProps = [string, string];

/* Excluded from this release type: MinifiedFolderMeta */

declare type MinifiedFolderMetaProps = [string, MinifiedFileEntryMeta[], MinifiedFolderEntryMeta[], number, number];

declare type MoveFileArgs = {
    file: FileEntryMeta;
    to: string;
};

declare type MoveFolderArgs = {
    folder: FolderEntryMeta;
    to: string;
};

declare class NetQueue<T> extends EventEmitter {
    updating: boolean;
    queue: NetQueueEntry[];
    types: {
        [type: string]: (obj: T, payload: any) => T | Promise<T>;
    };
    result: T;
    data: {
        [key: string]: any;
    };
    private _fetch;
    private _update;
    private _timeout;
    constructor({ fetch, update, data, timeout }: NetQueueProps<T>);
    push: ({ type, payload }: NetQueueEntry) => void;
    addType: ({ type, handler }: NetQueueType<T>) => void;
    private _process;
}

declare type NetQueueEntry = {
    type: string;
    payload: any;
};

declare type NetQueueProps<T> = {
    fetch: () => T | Promise<T>;
    update: (obj: T) => void;
    data?: {
        [key: string]: any;
    };
    timeout?: number;
};

declare type NetQueueType<T> = {
    type: string;
    handler: (obj: T, payload: any) => T | Promise<T>;
};

declare type RenameFileArgs = {
    file: FileEntryMeta;
    name: string;
};

declare type RenameFolderArgs = {
    folder: FolderEntryMeta;
    name: string;
};

declare type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
}[Keys];

/* Excluded from this release type: setMetadata */

/* Excluded from this release type: Upload */

declare type UploadOptions = {
    autoStart?: boolean;
    endpoint?: boolean;
    params?: FileMetaOptions;
};

declare class UploadStream extends Writable {
    account: any;
    hash: Buffer;
    endpoint: any;
    options: any;
    size: number;
    endIndex: number;
    private bytesUploaded;
    private blockBuffer;
    private partBuffer;
    private bufferSize;
    private ongoingUploads;
    private retries;
    private partIndex;
    private finalCallback;
    constructor(account: any, hash: any, size: any, endpoint: any, options: any);
    _write(data: any, encoding: any, callback: any): void;
    _final(callback: any): void;
    _addPart(): void;
    _attemptUpload(): void;
    _upload(part: any): void;
    _afterUpload(part: any): void;
    _finishUpload(): Promise<void>;
    _confirmUpload(data: any): Promise<boolean>;
    _uploadError(error: any, part: any): void;
}

/* Excluded from this release type: v0 */

/* Excluded from this release type: v1 */

export { }
