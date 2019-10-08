import { getFolderMeta } from "./getFolderMeta"

import { MasterHandle } from "../../../../account"
import { FileEntryMeta } from "../../file-entry"

import { createMetaQueue } from "./createMetaQueue"

import { cleanPath } from "../../../../utils/cleanPath"

type RenameFileArgs = {
	file: FileEntryMeta,
	name: string
}

const renameFile = async (masterHandle: MasterHandle, dir: string, { file, name }: RenameFileArgs) => {
	dir = cleanPath(dir)

	const meta = await getFolderMeta(masterHandle, dir).catch(console.warn)

	if (!meta)
		throw new Error("Folder does not exist")

	const existingFile = meta.files.find(f => file === f || file.name === f.name)

	// file is no longer in the metadata
	if (!existingFile)
		throw new Error("File no longer exists")

	createMetaQueue(masterHandle, dir)

	masterHandle.metaQueue[dir].push({
		type: "remove-file",
		payload: existingFile
	})

	masterHandle.metaQueue[dir].push({
		type: "add-file",
		payload: new FileEntryMeta({
			...existingFile,
			name
		})
	})
}

export { renameFile, RenameFileArgs }
