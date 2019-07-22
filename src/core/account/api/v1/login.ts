import { FolderMeta } from "../../../../core/account/folder-meta";
import { MasterHandle } from "../../../../account";

import { getFolderMeta } from "../v0/index";

const login = async (masterHandle: MasterHandle) => {
	// try newer meta
	try {
		await masterHandle.getFolderMeta("/")
	} catch (err) {
		// try older meta
		try {
			const meta = await getFolderMeta(masterHandle, "/")

			await masterHandle.deleteFolderMeta("/").catch(console.warn)
			await masterHandle.createFolderMeta("/").catch(console.warn)

			console.info("--- META ---", meta)
			await masterHandle.setFolderMeta("/", new FolderMeta(meta))
		} catch (err) {
			// no meta exists
			// set meta to an empty meta
			console.warn(err)
			await masterHandle.createFolderMeta("/").catch(console.warn)
			await masterHandle.setFolderMeta("/", new FolderMeta())
		}
	}
}

export { login }
