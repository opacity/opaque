import { getFolderMeta } from "./getFolderMeta"
import { setFolderMeta } from "./setFolderMeta"
import { deleteFolderMeta } from "./deleteFolderMeta"
import { getFolderLocation } from "./index"

import { MasterHandle } from "../../../../account"
import { FolderEntryMeta } from "../../folder-entry"

import { createMetaQueue } from "./createMetaQueue"
import { createFolder } from "./createFolder";

type RenameFolderArgs = {
	folder: FolderEntryMeta,
	name: string
}

const renameFolder = async (masterHandle: MasterHandle, dir: string, { folder, name }: RenameFolderArgs) => {
	if (name.indexOf("/") > 0 || name.length > 2 ** 8)
		throw new Error("Invalid folder name")

	const
		oldDir = (dir + "/" + folder.name).replace(/\/+/g, "/"),
		newDir = (dir + "/" + name).replace(/\/+/g, "/")

	const
		folderMeta = await getFolderMeta(masterHandle, dir).catch(console.warn),
		meta = await getFolderMeta(masterHandle, dir).catch(console.warn)

	if (!folderMeta)
		throw new Error("Folder does not exist")

	if (!meta)
		throw new Error("Outer folder does not exist")

	if (await getFolderMeta(masterHandle, newDir).catch(console.warn))
		throw new Error("Folder already exists")

	const existingFolder = meta.folders.find(f => folder === f || folder.name === f.name)

	// folder is no longer in the metadata
	if (!existingFolder)
		throw new Error("Folder no longer exists")

	await createFolder(masterHandle, dir, name)
	await setFolderMeta(masterHandle, newDir, await getFolderMeta(masterHandle, oldDir))
	await deleteFolderMeta(masterHandle, oldDir)

	createMetaQueue(masterHandle, dir)

	masterHandle.metaQueue[dir].push({
		type: "remove-folder",
		payload: existingFolder
	})

	masterHandle.metaQueue[dir].push({
		type: "add-folder",
		payload: new FolderEntryMeta({
			name,
			location: getFolderLocation(masterHandle, newDir)
		})
	})
}

export { renameFolder, RenameFolderArgs }
