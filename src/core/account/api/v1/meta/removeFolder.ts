import { NetQueue } from "../../../../../utils/netQueue"

import { FolderEntryMeta } from "../../../folder-entry"
import { FolderMeta } from "../../../folder-meta"

const removeFolder = async (metaQueue: NetQueue<FolderMeta>, meta: FolderMeta, folder: FolderEntryMeta) => {
	// precondition for if folder is no longer in the metadata
	if (!meta.folders.find(f => folder === f || folder.name === f.name))
		return meta

	meta.folders = meta.folders.filter(f => folder !== f && folder.name !== f.name)

	return meta
}

export { removeFolder }
