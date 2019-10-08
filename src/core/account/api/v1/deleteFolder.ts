import { MasterHandle } from "../../../../account"
import { FolderEntryMeta } from "../../folder-entry"
import { createMetaQueue } from "./createMetaQueue";

import { posix } from "path-browserify";
import { cleanPath } from "../../../../utils/cleanPath";

const deleteFolder = async (masterHandle: MasterHandle, dir: string, folder: FolderEntryMeta) => {
	dir = cleanPath(dir)
	const fullDir = posix.join(dir, folder.name)

	if (folder.name.indexOf("/") > 0 || folder.name.length > 2 ** 8)
		throw new Error("Invalid folder name")

	const meta = await masterHandle.getFolderMeta(fullDir).catch(console.warn)

	if (meta) {
		await Promise.all([
			(async () => {
				try {
					for (let folder of meta.folders) {
						await masterHandle.deleteFolder(fullDir, folder)
					}
				} catch (err) {
					console.error("Failed to delete sub folders")
					throw err
				}
			})(),
			(async () => {
				try {
					for (let file of meta.files) {
						await masterHandle.deleteFile(fullDir, file)
					}
				} catch (err) {
					console.error("Failed to delete file")
					throw err
				}
			})()
		])
	}

	try {
		await masterHandle.deleteFolderMeta(fullDir)
	} catch (err) {
		console.error("Failed to delete meta entry")
		throw err
	}

	createMetaQueue(masterHandle, dir)
	masterHandle.metaQueue[dir].push({
		type: "remove-folder",
		payload: folder
	})
}

export { deleteFolder }
