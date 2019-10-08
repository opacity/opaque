import { NetQueue } from "../../../../utils/netQueue"

import { MasterHandle } from "../../../../account"
import { FolderMeta } from "../../folder-meta"

import { getFolderMeta } from "./getFolderMeta"
import { setFolderMeta } from "./setFolderMeta"

import { removeFile } from "./meta/removeFile"
import { removeVersion } from "./meta/removeVersion"
import { addFile } from "./meta/addFile"
import { addFolder } from "./meta/addFolder"
import { removeFolder } from "./meta/removeFolder"

import { cleanPath } from "../../../../utils/cleanPath"

const createMetaQueue = (masterHandle: MasterHandle, dir: string) => {
	dir = cleanPath(dir)

	if (masterHandle.metaQueue[dir])
		return

	const metaQueue = new NetQueue({
		fetch: async () => {
			return getFolderMeta(masterHandle, dir)
		},
		update: async (meta: FolderMeta) => {
			await setFolderMeta(masterHandle, dir, meta)
		}
	})

	const types = [
		{ type: "add-folder", action: addFolder },
		{ type: "add-file", action: addFile },
		{ type: "remove-folder", action: removeFolder },
		{ type: "remove-file", action: removeFile },
		{ type: "remove-version", action: removeVersion }
	]

	for (let type of types) {
		metaQueue.addType({
			type: type.type,
			handler: async (meta: FolderMeta, payload) => {
				return await type.action(metaQueue, meta, payload)
			}
		})
	}

	masterHandle.metaQueue[dir] = metaQueue
}

export { createMetaQueue }
