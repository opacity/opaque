import { deleteFile as requestDeleteFile } from "../../../../core/requests/deleteFile"

import { MasterHandle } from "../../../../account"
import { FolderMeta } from "../../metadata"
import { FileVersion } from "../../file-version"
import { createMetaQueue } from "./createMetaQueue";

import { cleanPath } from "../../../../utils/cleanPath";

const deleteVersion = async (masterHandle: MasterHandle, dir: string, version: FileVersion) => {
	dir = cleanPath(dir)

	await requestDeleteFile(
		masterHandle.uploadOpts.endpoint,
		masterHandle,
		// only send the location, not the private key
		version.handle.slice(0, 64)
	).catch(err => {
		console.warn("version does not exist")
		console.warn(err)
	})

	createMetaQueue(masterHandle, dir)
	masterHandle.metaQueue[dir].push({
		type: "remove-version",
		payload: version
	})
}

export { deleteVersion }
