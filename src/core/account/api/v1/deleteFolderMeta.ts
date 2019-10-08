import { deleteMetadata } from "../../../../core/requests/metadata"

import { MasterHandle } from "../../../../account"

import { cleanPath } from "../../../../utils/cleanPath";

const deleteFolderMeta = async (masterHandle: MasterHandle, dir: string) => {
	dir = cleanPath(dir)

	// TODO: verify folder can only be changed by the creating account
	await deleteMetadata(
		masterHandle.uploadOpts.endpoint,
		masterHandle,
		// masterHandle.getFolderHDKey(dir),
		masterHandle.getFolderLocation(dir)
	);
}

export { deleteFolderMeta }
