import { NetQueue } from "../../../../../utils/netQueue"

import { FolderMeta } from "../../../folder-meta"
import { FolderEntryMeta } from "../../../folder-entry"

const addFolder = (metaQueue: NetQueue<FolderMeta>, meta: FolderMeta, folder: FolderEntryMeta) => {
	const existingFolder = meta.folders.find(f => folder === f || folder.name === f.name)

	if (!existingFolder)
		meta.folders.push(folder)

	return meta
}

export { addFolder }
