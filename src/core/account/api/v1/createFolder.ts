import { MasterHandle } from "../../../../account"
import { FolderEntryMeta } from "../../../../core/account/folder-entry"
import { FolderMeta } from "../../../../core/account/folder-meta"
import { createMetaQueue } from "./createMetaQueue";

const createFolder = async (masterHandle: MasterHandle, dir: string, name: string) => {
	dir = dir.replace(/\/+/g, "/")
	const fullDir = (dir + "/" + name).replace(/\/+/g, "/")

	if (name.indexOf("/") > 0 || name.length > 2 ** 8)
		throw new Error("Invalid folder name")

	if (await masterHandle.getFolderMeta(fullDir).catch(console.warn))
		throw new Error("Folder already exists")

	await masterHandle.createFolderMeta(fullDir).catch(console.warn)
	await masterHandle.setFolderMeta(fullDir, new FolderMeta({ name }))

	createMetaQueue(masterHandle, dir)
	masterHandle.metaQueue[dir].push({
		type: "add-folder",
		payload: new FolderEntryMeta({
			name,
			location: masterHandle.getFolderLocation(fullDir)
		})
	})
}

export { createFolder }
