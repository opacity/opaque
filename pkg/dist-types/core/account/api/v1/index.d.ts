/// <reference path="../../../../../../src/types/hdkey.d.ts" />
/// <reference types="node" />
import { downloadFile } from "../v0/downloadFile";
import { generateSubHDKey } from "../v0/generateSubHDKey";
import { getAccountInfo } from "../v0/getAccountInfo";
import { getFolderHDKey } from "../v0/getFolderHDKey";
import { getFolderLocation } from "../v0/getFolderLocation";
import { getHandle } from "../v0/getHandle";
import { isPaid } from "../v0/isPaid";
import { register } from "../v0/register";
import { buildFullTree } from "./buildFullTree";
import { createFolder } from "./createFolder";
import { createFolderMeta } from "./createFolderMeta";
import { createMetaQueue } from "./createMetaQueue";
import { deleteFile } from "./deleteFile";
import { deleteFolder } from "./deleteFolder";
import { deleteFolderMeta } from "./deleteFolderMeta";
import { deleteVersion } from "./deleteVersion";
import { getFolderMeta } from "./getFolderMeta";
import { isExpired } from "./isExpired";
import { login } from "./login";
import { moveFile, MoveFileArgs } from "./moveFile";
import { moveFolder, MoveFolderArgs } from "./moveFolder";
import { renameFile, RenameFileArgs } from "./renameFile";
import { renameFolder, RenameFolderArgs } from "./renameFolder";
import { renewAccount } from "./renewAccount";
import { setFolderMeta } from "./setFolderMeta";
import { upgradeAccount } from "./upgradeAccount";
import { uploadFile } from "./uploadFile";
export { downloadFile, generateSubHDKey, getAccountInfo, getFolderHDKey, getFolderLocation, getHandle, isPaid, register, buildFullTree, createFolder, createFolderMeta, createMetaQueue, deleteFile, deleteFolder, deleteFolderMeta, deleteVersion, getFolderMeta, isExpired, login, moveFile, MoveFileArgs, moveFolder, MoveFolderArgs, renameFile, RenameFileArgs, renameFolder, RenameFolderArgs, renewAccount, setFolderMeta, upgradeAccount, uploadFile };
/**
 * internal API v1
 *
 * @internal
 */
declare const v1: {
    downloadFile: (masterHandle: import("../../../../account").MasterHandle, handle: string) => import("../../../..").Download;
    generateSubHDKey: (masterHandle: import("../../../../account").MasterHandle, pathString: string) => import("hdkey").default;
    getAccountInfo: (masterHandle: import("../../../../account").MasterHandle) => Promise<any>;
    getFolderHDKey: (masterHandle: import("../../../../account").MasterHandle, dir: string) => import("hdkey").default;
    getFolderLocation: (masterHandle: import("../../../../account").MasterHandle, dir: string) => string;
    getHandle: (masterHandle: import("../../../../account").MasterHandle) => string;
    isPaid: (masterHandle: import("../../../../account").MasterHandle) => Promise<boolean>;
    register: (masterHandle: import("../../../../account").MasterHandle, duration?: number, limit?: number) => Promise<{
        data: any;
        waitForPayment: () => Promise<unknown>;
    }>;
    buildFullTree: (masterHandle: import("../../../../account").MasterHandle, dir?: string) => Promise<{
        [key: string]: import("../../folder-meta").FolderMeta;
    }>;
    createFolder: (masterHandle: import("../../../../account").MasterHandle, dir: string, name: string) => Promise<void>;
    createFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string) => Promise<void>;
    createMetaQueue: (masterHandle: import("../../../../account").MasterHandle, dir: string) => void;
    deleteFile: (masterHandle: import("../../../../account").MasterHandle, dir: string, file: import("../../file-entry").FileEntryMeta) => Promise<void>;
    deleteFolder: (masterHandle: import("../../../../account").MasterHandle, dir: string, folder: import("../../folder-entry").FolderEntryMeta) => Promise<void>;
    deleteFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string) => Promise<void>;
    deleteVersion: (masterHandle: import("../../../../account").MasterHandle, dir: string, version: import("../../file-version").FileVersion) => Promise<void>;
    getFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string) => Promise<import("../../folder-meta").FolderMeta>;
    isExpired: (masterHandle: import("../../../../account").MasterHandle) => Promise<boolean>;
    login: (masterHandle: import("../../../../account").MasterHandle) => Promise<void>;
    moveFile: (masterHandle: import("../../../../account").MasterHandle, dir: string, { file, to }: MoveFileArgs) => Promise<void>;
    moveFolder: (masterHandle: import("../../../../account").MasterHandle, dir: string, { folder, to }: MoveFolderArgs) => Promise<void>;
    renameFile: (masterHandle: import("../../../../account").MasterHandle, dir: string, { file, name }: RenameFileArgs) => Promise<void>;
    renameFolder: (masterHandle: import("../../../../account").MasterHandle, dir: string, { folder, name }: RenameFolderArgs) => Promise<void>;
    renewAccount: (masterHandle: import("../../../../account").MasterHandle, duration?: number) => Promise<{
        data: any;
        waitForPayment: () => Promise<unknown>;
    }>;
    setFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string, folderMeta: import("../../folder-meta").FolderMeta) => Promise<void>;
    upgradeAccount: (masterHandle: import("../../../../account").MasterHandle, duration?: number, limit?: number) => Promise<{
        data: any;
        waitForPayment: () => Promise<unknown>;
    }>;
    uploadFile: (masterHandle: import("../../../../account").MasterHandle, dir: string, file: File) => import("events").EventEmitter;
};
export default v1;
