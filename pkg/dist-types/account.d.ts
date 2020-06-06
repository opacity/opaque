/// <reference types="node" />
import HDKey from "hdkey";
import { NetQueue } from "./utils/netQueue";
import { FolderMeta, FileEntryMeta, FileVersion, FolderEntryMeta } from "./core/account/metadata";
import { MoveFileArgs, MoveFolderArgs, RenameFileArgs, RenameFolderArgs } from "./core/account/api/v1/index";
import { RequireOnlyOne } from "./types/require-only-one";
/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for representing the account mnemonic
 *
 * @public
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
declare type MasterHandleCreator = RequireOnlyOne<{
    account: Account;
    handle: string;
}, "account" | "handle">;
declare type MasterHandleOptions = {
    uploadOpts?: any;
    downloadOpts?: any;
};
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
declare class MasterHandle extends HDKey {
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
    isExpired: () => Promise<boolean>;
    isPaid: () => Promise<boolean>;
    login: () => Promise<void>;
    register: (duration?: number, limit?: number) => Promise<{
        data: any;
        waitForPayment: () => Promise<unknown>;
    }>;
    upgrade: (duration?: number, limit?: number) => Promise<{
        data: any;
        waitForPayment: () => Promise<unknown>;
    }>;
    renew: (duration?: number) => Promise<{
        data: any;
        waitForPayment: () => Promise<unknown>;
    }>;
}
export { Account, MasterHandle, MasterHandleCreator, MasterHandleOptions, HDKey };
