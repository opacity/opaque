import { FolderMeta } from "../../../../core/account/folder-meta";
import { MasterHandle } from "../../../../account";

import { getFolderMeta } from "../v0/index";

const login = async (masterHandle: MasterHandle) => {
	// try older meta first
	try {
		const meta = await getFolderMeta(masterHandle, "/")

		await masterHandle.deleteFolderMeta("/").catch(console.warn)
		await masterHandle.createFolderMeta("/").catch(console.warn)

		console.info("--- META ---", meta)
		await masterHandle.setFolderMeta("/", new FolderMeta(meta))
	} catch (err) {
		// try newer meta
		try {
			await masterHandle.getFolderMeta("/")
		} catch (err) {
			// set meta to an empty meta
			console.warn(err)
			await masterHandle.createFolderMeta("/").catch(console.warn)
			await masterHandle.setFolderMeta("/", new FolderMeta())
		}
	}
}

export { login }
