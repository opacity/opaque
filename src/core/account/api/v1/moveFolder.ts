import { getFolderMeta } from "./getFolderMeta"
import { setFolderMeta } from "./setFolderMeta"
import { deleteFolderMeta } from "./deleteFolderMeta"
import { createFolder } from "./createFolder"

import { MasterHandle } from "../../../../account"
import { FolderEntryMeta } from "../../folder-entry"

import { createMetaQueue } from "./createMetaQueue"
import { createFolderMeta } from "./createFolderMeta";

import { posix } from "path-browserify"
import { cleanPath } from "../../../../utils/cleanPath"

type MoveFolderArgs = {
	folder: FolderEntryMeta,
	to: string
}

const moveFolder = async (masterHandle: MasterHandle, dir: string, { folder, to }: MoveFolderArgs) => {
	dir = cleanPath(dir)

	const
		oldDir = posix.join(dir, folder.name),
		newDir = posix.join(to, folder.name)

	const
		folderMeta = await getFolderMeta(masterHandle, oldDir).catch(console.warn),
		outerMeta = await getFolderMeta(masterHandle, dir).catch(console.warn),
		toMeta = await getFolderMeta(masterHandle, to).catch(console.warn)

	if (!folderMeta)
		throw new Error("Folder does not exist")

	if (!outerMeta)
		throw new Error("Outer folder does not exist")

	if (!toMeta)
		throw new Error("Can't move to folder that doesn't exist")

	if (await getFolderMeta(masterHandle, newDir).catch(console.warn))
		throw new Error("Folder already exists")

	const existingFolder = outerMeta.folders.find(f => folder === f || folder.name === f.name)

	// folder is no longer in the metadata
	if (!existingFolder)
		throw new Error("File no longer exists")

	await createFolderMeta(masterHandle, newDir).catch(console.warn)
	await setFolderMeta(masterHandle, newDir, await getFolderMeta(masterHandle, oldDir))
	await deleteFolderMeta(masterHandle, oldDir)

	createMetaQueue(masterHandle, dir)
	createMetaQueue(masterHandle, to)

	masterHandle.metaQueue[dir].push({
		type: "remove-folder",
		payload: existingFolder
	})

	masterHandle.metaQueue[to].push({
		type: "add-folder",
		payload: existingFolder
	})
}

export { moveFolder, MoveFolderArgs }
