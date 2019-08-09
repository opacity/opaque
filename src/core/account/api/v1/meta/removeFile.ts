import { NetQueue } from "../../../../../utils/netQueue"

import { FileEntryMeta } from "../../../file-entry"
import { FolderMeta } from "../../../folder-meta"

const removeFile = async (metaQueue: NetQueue<FolderMeta>, meta: FolderMeta, file: FileEntryMeta) => {
	// precondition for if file is no longer in the metadata
	if (!meta.files.find(f => file === f || file.name === f.name))
		return meta

	meta.files = meta.files.filter(f => file !== f && file.name !== f.name)

	return meta
}

export { removeFile }
