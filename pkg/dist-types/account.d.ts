/// <reference types="node" />
import HDKey from "hdkey";
import { FolderMeta } from "./core/account/metadata";
import { RequireOnlyOne } from "./types/require-only-one";
/**
 * **_this should never be shared or left in storage_**
 *
 * a class for representing the account mnemonic
 */
declare class Account {
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
/**
 * **_this should never be shared or left in storage_**
 *
 * a class for creating a master handle from an account mnemonic
 *
 * a master handle is responsible for:
 *  - logging in to an account
 *  - signing changes for the account
 *  - deterministic entropy for generating features of an account (such as file keys)
 */
declare class MasterHandle extends HDKey {
    uploadOpts: any;
    downloadOpts: any;
    metaQueue: {
        [key: string]: {
            resolve: () => void;
            file: {
                [key: string]: any;
                name: string;
                size: number;
                lastModified: number;
            };
            finishedUpload: {
                [key: string]: any;
                handle: string;
            };
        }[];
    };
    /**
     * creates a master handle from an account
     *
     * @param account - the account to generate the handle from
     */
    constructor({ account, handle, }: RequireOnlyOne<{
        account: Account;
        handle: string;
    }, "account" | "handle">, { uploadOpts, downloadOpts }?: {
        uploadOpts?: {};
        downloadOpts?: {};
    });
    readonly handle: string;
    /**
     * creates a sub key seed for validating
     *
     * @param path - the string to use as a sub path
     */
    private generateSubHDKey;
    uploadFile: (dir: string, file: File) => import("events").EventEmitter;
    downloadFile: (handle: string) => import("./download").default;
    deleteFile: (dir: string, name: string) => Promise<void>;
    deleteVersion: (dir: string, handle: string) => Promise<void>;
    static getKey(from: HDKey, str: string): string;
    /**
     * creates a file key seed for validating
     *
     * @param file - the location of the file on the network
     */
    getFileHDKey: (file: string) => HDKey;
    /**
     * creates a dir key seed for validating and folder navigation
     *
     * @param dir - the folder path in the UI
     */
    getFolderHDKey: (dir: string) => HDKey;
    getFolderLocation: (dir: string) => string;
    createFolderMeta: (dir: string) => Promise<void>;
    createFolder: (dir: string, name: string) => Promise<void>;
    deleteFolderMeta: (dir: string) => Promise<void>;
    deleteFolder: (dir: string, name: string) => Promise<void>;
    setFolderMeta: (dir: string, folderMeta: FolderMeta) => Promise<void>;
    getFolderMeta: (dir: string) => Promise<FolderMeta>;
    getAccountInfo: () => Promise<any>;
    isPaid: () => Promise<boolean>;
    login: () => Promise<void>;
    register: (duration?: number, limit?: number) => Promise<{}>;
    queueMeta: (dir: string, { file, finishedUpload }: {
        file: any;
        finishedUpload: any;
    }) => Promise<void>;
    private _updateMetaFromQueue;
}
export { Account, MasterHandle, HDKey };
