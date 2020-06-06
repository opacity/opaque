import { downloadFile } from "../v0/downloadFile";
import { generateSubHDKey } from "../v0/generateSubHDKey";
import { getAccountInfo } from "../v0/getAccountInfo";
import { getFolderHDKey } from "../v0/getFolderHDKey";
import { getFolderLocation } from "../v0/getFolderLocation";
import { getHandle } from "../v0/getHandle";
import { isPaid } from "../v0/isPaid";
import { register } from "../v0/register";

import { buildFullTree } from "./buildFullTree"
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
import { renewAccount } from "./renewAccount"
import { setFolderMeta } from "./setFolderMeta";
import { upgradeAccount } from "./upgradeAccount";
import { uploadFile } from "./uploadFile";

export {
	downloadFile,
	generateSubHDKey,
	getAccountInfo,
	getFolderHDKey,
	getFolderLocation,
	getHandle,
	isPaid,
	register,

	buildFullTree,
	createFolder,
	createFolderMeta,
	createMetaQueue,
	deleteFile,
	deleteFolder,
	deleteFolderMeta,
	deleteVersion,
	getFolderMeta,
	isExpired,
	login,
	moveFile,
	MoveFileArgs,
	moveFolder,
	MoveFolderArgs,
	renameFile,
	RenameFileArgs,
	renameFolder,
	RenameFolderArgs,
	renewAccount,
	setFolderMeta,
	upgradeAccount,
	uploadFile
}

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

	buildFullTree,
	createFolder,
	createFolderMeta,
	createMetaQueue,
	deleteFile,
	deleteFolder,
	deleteFolderMeta,
	deleteVersion,
	getFolderMeta,
	isExpired,
	login,
	moveFile,
	moveFolder,
	renameFile,
	renameFolder,
	renewAccount,
	setFolderMeta,
	upgradeAccount,
	uploadFile
}

export default v1
