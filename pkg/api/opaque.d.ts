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

/**
 * check whether a payment has gone through for an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to check
 *
 * @internal
 */
export declare function checkPaymentStatus(endpoint: string, hdNode: HDKey): Promise<import("axios").AxiosResponse<any>>;

/**
 * request the creation of an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKey
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */
export declare function createAccount(endpoint: string, hdNode: HDKey, metadataKey: string, duration?: number, limit?: number): Promise<import("axios").AxiosResponse<any>>;

/**
 * request creating a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
export declare function createMetadata(endpoint: string, hdNode: HDKey, metadataKey: string): Promise<import("axios").AxiosResponse<any>>;

declare class DecryptStream extends Transform {
    options: any;
    blockSize: any;
    key: any;
    iter: any;
    constructor(key: any, options?: any);
    _transform(chunk: any, encoding: any, callback: any): void;
}

/**
 * request deleting a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
export declare function deleteMetadata(endpoint: string, hdNode: HDKey, metadataKey: string): Promise<import("axios").AxiosResponse<any>>;

/**
 * @internal
 */
export declare class Download extends EventEmitter {
    options: DownloadOptions;
    handle: string;
    hash: string;
    key: string;
    downloadURLRequest: any;
    metadataRequest: any;
    downloadURL: string;
    isDownloading: boolean;
    decryptStream: DecryptStream;
    downloadStream: DownloadStream;
    _metadata: FileMeta;
    private size;
    constructor(handle: any, opts?: DownloadOptions);
    metadata: () => Promise<FileMeta>;
    toBuffer: () => Promise<{}>;
    toFile: () => Promise<{}>;
    startDownload: () => Promise<void>;
    getDownloadURL: (overwrite?: boolean) => Promise<string>;
    downloadMetadata: (overwrite?: boolean) => Promise<FileMeta>;
    downloadFile: () => Promise<boolean>;
    finishDownload: (error: any) => void;
    propagateError: (error: any) => void;
}

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
    /** @internal */
    minify: () => MinifiedFileEntryMeta;
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
    /** @internal */
    minify: () => MinifiedFileVersion;
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
    /** @internal */
    minify: () => MinifiedFolderEntryMeta;
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
    /** @internal */
    minify: () => MinifiedFolderMeta;
}

/**
 * request get of a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */
export declare function getMetadata(endpoint: string, hdNode: HDKey, metadataKey: string): Promise<import("axios").AxiosResponse<any>>;

/**
 * get a signed payload from an hdkey
 *
 * @param rawPayload - a payload object to be processed and signed
 * @param hdNode = the account to sign with
 * @param key
 *
 * @internal
 */
export declare function getPayload(rawPayload: any, hdNode: HDKey, key?: string): {
    signature: string;
    publicKey: string;
    hash: string;
};

/**
 * get a signed formdata payload from an hdkey
 *
 * @param rawPayload - a payload object to be processed and signed
 * @param extraPayload - additional (unsigned) payload information
 * @param hdNode - the account to sign with
 * @param key
 *
 * @internal
 */
export declare function getPayloadFD(rawPayload: {
    [key: string]: any;
}, extraPayload: any, hdNode: HDKey, key?: string): FormDataNode | FormData;

/**
 * get a list of available plans
 *
 * @param endpoint
 *
 * @internal
 */
export declare function getPlans(endpoint: string): Promise<import("axios").AxiosResponse<any>>;
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
    getAccountInfo: () => Promise<any>;
    isPaid: () => Promise<boolean>;
    login: () => Promise<void>;
    register: (duration?: number, limit?: number) => Promise<{}>;
}

export declare type MasterHandleCreator = RequireOnlyOne<{
    account: Account;
    handle: string;
}, "account" | "handle">;

export declare type MasterHandleOptions = {
    uploadOpts?: any;
    downloadOpts?: any;
};

/**
 * @internal
 */
export declare class MinifiedFileEntryMeta extends Array {
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

declare type MinifiedFileEntryMetaProps = [string, number, number, MinifiedFileVersion[]];

/**
 * @internal
 */
export declare class MinifiedFileVersion extends Array {
    constructor([handle, size, created, modified]: MinifiedFileVersionProps);
    unminify: () => FileVersion;
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
export declare class MinifiedFolderEntryMeta extends Array {
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

declare type MinifiedFolderEntryMetaProps = [string, string];

/**
 * @internal
 */
export declare class MinifiedFolderMeta extends Array {
    /** a nickname shown on the folder when accessed without adding to account metadata */
    0: string;
    /** the files included only in the most shallow part of the folder */
    1: MinifiedFileEntryMeta[];
    /** the folders included only in the most shallow part of the folder */
    2: MinifiedFolderEntryMeta[];
    /** when the folder was created (if not created now) in `ms` */
    3: number;
    /** when the folder was changed (if not modified now) in `ms` */
    4: number;
    constructor([name, files, folders, created, modified]: MinifiedFolderMetaProps);
    unminify: () => FolderMeta;
}

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

/**
 * request changing a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 * @param metadata - the metadata to put
 *
 * @internal
 */
export declare function setMetadata(endpoint: string, hdNode: HDKey, metadataKey: string, metadata: string): Promise<import("axios").AxiosResponse<any>>;

/**
 * @internal
 */
export declare class Upload extends EventEmitter {
    account: HDKey;
    options: UploadOptions;
    data: FileData;
    uploadSize: any;
    key: string;
    hash: string;
    handle: string;
    metadata: FileMeta;
    readStream: Readable;
    encryptStream: EncryptStream;
    uploadStream: UploadStream;
    constructor(file: any, account: any, opts?: UploadOptions);
    startUpload: () => Promise<void>;
    uploadMetadata: () => Promise<void>;
    uploadFile: () => Promise<void>;
    finishUpload: () => Promise<void>;
    propagateError: (error: any) => void;
}

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

/**
 * internal API v0
 *
 * @internal
 */
export declare const v0: {
    downloadFile: (masterHandle: import("../../../../account").MasterHandle, handle: string) => import("../../../..").Download;
    generateSubHDKey: (masterHandle: import("../../../../account").MasterHandle, pathString: string) => import("hdkey").default;
    getAccountInfo: (masterHandle: import("../../../../account").MasterHandle) => Promise<any>;
    getFolderHDKey: (masterHandle: import("../../../../account").MasterHandle, dir: string) => import("hdkey").default;
    getFolderLocation: (masterHandle: import("../../../../account").MasterHandle, dir: string) => string;
    getFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string) => Promise<import("../../folder-meta").FolderMeta>;
    getHandle: (masterHandle: import("../../../../account").MasterHandle) => string;
    isPaid: (masterHandle: import("../../../../account").MasterHandle) => Promise<boolean>;
    register: (masterHandle: import("../../../../account").MasterHandle, duration?: number, limit?: number) => Promise<{}>;
};

/**
 * internal API v1
 *
 * @internal
 */
export declare const v1: {
    downloadFile: (masterHandle: import("../../../../account").MasterHandle, handle: string) => import("../../../..").Download;
    generateSubHDKey: (masterHandle: import("../../../../account").MasterHandle, pathString: string) => import("hdkey").default;
    getAccountInfo: (masterHandle: import("../../../../account").MasterHandle) => Promise<any>;
    getFolderHDKey: (masterHandle: import("../../../../account").MasterHandle, dir: string) => import("hdkey").default;
    getFolderLocation: (masterHandle: import("../../../../account").MasterHandle, dir: string) => string;
    getHandle: (masterHandle: import("../../../../account").MasterHandle) => string;
    isPaid: (masterHandle: import("../../../../account").MasterHandle) => Promise<boolean>;
    register: (masterHandle: import("../../../../account").MasterHandle, duration?: number, limit?: number) => Promise<{}>;
    createFolder: (masterHandle: import("../../../../account").MasterHandle, dir: string, name: string) => Promise<void>;
    createFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string) => Promise<void>;
    createMetaQueue: (masterHandle: import("../../../../account").MasterHandle, dir: string) => void;
    deleteFile: (masterHandle: import("../../../../account").MasterHandle, dir: string, file: import("../../file-entry").FileEntryMeta) => Promise<void>;
    deleteFolder: (masterHandle: import("../../../../account").MasterHandle, dir: string, folder: import("../../folder-entry").FolderEntryMeta) => Promise<void>;
    deleteFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string) => Promise<void>;
    deleteVersion: (masterHandle: import("../../../../account").MasterHandle, dir: string, version: import("../../file-version").FileVersion) => Promise<void>;
    getFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string) => Promise<import("../../folder-meta").FolderMeta>;
    login: (masterHandle: import("../../../../account").MasterHandle) => Promise<void>;
    moveFile: (masterHandle: import("../../../../account").MasterHandle, dir: string, { file, to }: MoveFileArgs) => Promise<void>;
    moveFolder: (masterHandle: import("../../../../account").MasterHandle, dir: string, { folder, to }: MoveFolderArgs) => Promise<void>;
    renameFile: (masterHandle: import("../../../../account").MasterHandle, dir: string, { file, name }: RenameFileArgs) => Promise<void>;
    renameFolder: (masterHandle: import("../../../../account").MasterHandle, dir: string, { folder, name }: RenameFolderArgs) => Promise<void>;
    setFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string, folderMeta: import("../../folder-meta").FolderMeta) => Promise<void>;
    uploadFile: (masterHandle: import("../../../../account").MasterHandle, dir: string, file: File) => import("events").EventEmitter;
};

export { }
