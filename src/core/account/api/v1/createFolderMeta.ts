import { createMetadata } from "~/core/requests/metadata"

import { MasterHandle } from "~/account"

const createFolderMeta = async (masterHandle: MasterHandle, dir: string) => {
	dir = dir.replace(/\/+/g, "/")

	try {
		// TODO: verify folder can only be changed by the creating account
		await createMetadata(
			masterHandle.uploadOpts.endpoint,
			masterHandle,
			// masterHandle.getFolderHDKey(dir),
			masterHandle.getFolderLocation(dir)
		);
	} catch (err) {
		console.error(`Can't create folder metadata for folder ${ dir }`)
		throw err
	}
}

export { createFolderMeta }
