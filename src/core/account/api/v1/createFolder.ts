import { MasterHandle } from "../../../../account"
import { FolderEntryMeta } from "../../../../core/account/folder-entry"
import { FolderMeta } from "../../../../core/account/folder-meta"

import { createMetaQueue } from "./createMetaQueue";

// TODO: don't use polyfill
import { posix } from "path-browserify";
import { cleanPath } from "../../../../utils/cleanPath";

const createFolderFn = async (masterHandle: MasterHandle, dir: string, name: string) => {
	const fullDir = posix.join(dir, name)

	if (name.indexOf("/") > 0 || name.length > 2 ** 8)
		throw new Error("Invalid folder name")

	// recurively create containing folders first
	if (!await masterHandle.getFolderMeta(dir).catch(console.warn))
		await createFolder(masterHandle, posix.dirname(dir), posix.basename(dir))

	if (await masterHandle.getFolderMeta(fullDir).catch(console.warn))
		throw new Error("Folder already exists")

	// initialize as empty folder
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

const createFolder = async (masterHandle: MasterHandle, dir: string, name: string) => {
	dir = cleanPath(dir)
	const fullDir = posix.join(dir, name)

	if (masterHandle.metaFolderCreating[fullDir]) {
		// TODO: this is hacky
		await new Promise(resolve => {
			const interval = setInterval(() => {
				if (!masterHandle.metaFolderCreating[fullDir]) {
					resolve()
					clearInterval(interval)
				}
			}, 250)
		})
		return
	}

	masterHandle.metaFolderCreating[fullDir] = true
	await createFolderFn(masterHandle, dir, name)
	masterHandle.metaFolderCreating[fullDir] = false
}

export { createFolder }
