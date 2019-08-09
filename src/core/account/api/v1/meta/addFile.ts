import { NetQueue } from "../../../../../utils/netQueue"

import { FolderMeta } from "../../../folder-meta"
import { FileEntryMeta } from "../../../file-entry"

const addFile = (metaQueue: NetQueue<FolderMeta>, meta: FolderMeta, file: FileEntryMeta) => {
	const existingFile = meta.files.find(f => file === f || file.name === f.name)

	if (existingFile) {
		existingFile.modified = file.modified
		existingFile.versions = [...existingFile.versions, ...file.versions]
	} else {
		meta.files.push(file)
	}

	return meta
}

export { addFile }
