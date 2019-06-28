import { MasterHandle } from "~/account"

const deleteFolder = async (masterHandle: MasterHandle, dir: string, name: string) => {
	dir = dir.replace(/\/+/g, "/")
	const fullDir = (dir + "/" + name).replace(/\/+/g, "/")

	if (name.indexOf("/") > 0 || name.length > 2 ** 8)
		throw new Error("Invalid folder name")

	const meta = await masterHandle.getFolderMeta(fullDir)

	await Promise.all([
		async () => {
			try {
				for (let folder of meta.folders) {
					await masterHandle.deleteFolder(fullDir, folder.name)
				}
			} catch (err) {
				console.error("Failed to delete sub folders")
				throw err
			}
		},
		async () => {
			try {
				for (let file of meta.files) {
					await masterHandle.deleteFolder(fullDir, file.name)
				}
			} catch (err) {
				console.error("Failed to delete file")
				throw err
			}
		}
	])

	try {
		await masterHandle.deleteFolderMeta(fullDir)
	} catch (err) {
		console.error("Failed to delete meta entry")
		throw err
	}

	try {
		const parentMeta = await masterHandle.getFolderMeta(dir)

		parentMeta.folders.splice(parentMeta.folders.findIndex(folder => folder.name == name), 1)

		await masterHandle.setFolderMeta(dir, parentMeta)
	} catch (err) {
		console.error("Failed to update parent meta")
		console.error(err)
	}
}

export { deleteFolder }
