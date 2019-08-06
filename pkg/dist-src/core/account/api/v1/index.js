import { downloadFile } from "../v0/downloadFile";
import { generateSubHDKey } from "../v0/generateSubHDKey";
import { getAccountInfo } from "../v0/getAccountInfo";
import { getFolderHDKey } from "../v0/getFolderHDKey";
import { getFolderLocation } from "../v0/getFolderLocation";
import { getHandle } from "../v0/getHandle";
import { isPaid } from "../v0/isPaid";
import { register } from "../v0/register";
import { createFolder } from "./createFolder";
import { createFolderMeta } from "./createFolderMeta";
import { createMetaQueue } from "./createMetaQueue";
import { deleteFile } from "./deleteFile";
import { deleteFolder } from "./deleteFolder";
import { deleteFolderMeta } from "./deleteFolderMeta";
import { deleteVersion } from "./deleteVersion";
import { getFolderMeta } from "./getFolderMeta";
import { login } from "./login";
import { setFolderMeta } from "./setFolderMeta";
import { uploadFile } from "./uploadFile";
export { downloadFile, generateSubHDKey, getAccountInfo, getFolderHDKey, getFolderLocation, getHandle, isPaid, register, createFolder, createFolderMeta, createMetaQueue, deleteFile, deleteFolder, deleteFolderMeta, deleteVersion, getFolderMeta, login, setFolderMeta, uploadFile };
/**
 * internal API v1
 *
 * @internal
 */
const v1 = {
    downloadFile,
    generateSubHDKey,
    getAccountInfo,
    getFolderHDKey,
    getFolderLocation,
    getHandle,
    isPaid,
    register,
    createFolder,
    createFolderMeta,
    createMetaQueue,
    deleteFile,
    deleteFolder,
    deleteFolderMeta,
    deleteVersion,
    getFolderMeta,
    login,
    setFolderMeta,
    uploadFile
};
export default v1;
