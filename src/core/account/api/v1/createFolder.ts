import { MasterHandle } from "../../../../account"
import { FolderEntryMeta } from "../../../../core/account/folder-entry"
import { FolderMeta } from "../../../../core/account/folder-meta"

const createFolder = async (masterHandle: MasterHandle, dir: string, name: string) => {
	dir = dir.replace(/\/+/g, "/")
	const fullDir = (dir + "/" + name).replace(/\/+/g, "/")

	if (name.indexOf("/") > 0 || name.length > 2 ** 8)
		throw new Error("Invalid folder name")

	if (await masterHandle.getFolderMeta(fullDir).catch(console.warn))
		throw new Error("Folder already exists")

	const location = masterHandle.getFolderLocation(dir)

	let dirMeta = await masterHandle.getFolderMeta(dir)

	try {
		await masterHandle.getFolderMeta(fullDir)

		console.warn("Folder already exists")

		dirMeta.folders.push(new FolderEntryMeta({ name, location }))

		await masterHandle.setFolderMeta(dir, dirMeta)

		return
	} catch (err) {
		console.warn(err)
	}

	await masterHandle.createFolderMeta(fullDir)

	try {
		await masterHandle.setFolderMeta(fullDir, new FolderMeta())
	} catch (err) {
		console.error("Failed to set folder meta for dir: " + dir)
		throw err
	}

	try {
		dirMeta.folders.push(new FolderEntryMeta({ name, location }))

		await masterHandle.setFolderMeta(dir, dirMeta)
	} catch (err) {
		console.error("Failed to set folder meta for dir: " + dir)
		throw err
	}
}

export { createFolder }
