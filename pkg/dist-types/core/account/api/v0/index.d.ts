/// <reference path="../../../../../../src/types/hdkey.d.ts" />
import { downloadFile } from "../v0/downloadFile";
import { generateSubHDKey } from "../v0/generateSubHDKey";
import { getAccountInfo } from "../v0/getAccountInfo";
import { getFolderHDKey } from "../v0/getFolderHDKey";
import { getFolderLocation } from "../v0/getFolderLocation";
import { getFolderMeta } from "../v0/getFolderMeta";
import { getHandle } from "../v0/getHandle";
import { isPaid } from "../v0/isPaid";
import { register } from "../v0/register";
export { downloadFile, generateSubHDKey, getAccountInfo, getFolderHDKey, getFolderLocation, getFolderMeta, getHandle, isPaid, register };
/**
 * internal API v0
 *
 * @internal
 */
declare const v0: {
    downloadFile: (masterHandle: import("../../../../account").MasterHandle, handle: string) => import("../../../..").Download;
    generateSubHDKey: (masterHandle: import("../../../../account").MasterHandle, pathString: string) => import("hdkey").default;
    getAccountInfo: (masterHandle: import("../../../../account").MasterHandle) => Promise<any>;
    getFolderHDKey: (masterHandle: import("../../../../account").MasterHandle, dir: string) => import("hdkey").default;
    getFolderLocation: (masterHandle: import("../../../../account").MasterHandle, dir: string) => string;
    getFolderMeta: (masterHandle: import("../../../../account").MasterHandle, dir: string) => Promise<import("../../folder-meta").FolderMeta>;
    getHandle: (masterHandle: import("../../../../account").MasterHandle) => string;
    isPaid: (masterHandle: import("../../../../account").MasterHandle) => Promise<boolean>;
    register: (masterHandle: import("../../../../account").MasterHandle, duration?: number, limit?: number) => Promise<{
        data: any;
        waitForPayment: () => Promise<unknown>;
    }>;
};
export default v0;
