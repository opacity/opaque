/// <reference path="../../../../../../src/types/hdkey.d.ts" />
import { MasterHandle } from "../../../../account";
declare const getFolderHDKey: (masterHandle: MasterHandle, dir: string) => import("hdkey").default;
export { getFolderHDKey };
