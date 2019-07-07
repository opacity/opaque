import { FolderMeta } from "../../../../core/account/folder-meta";
import { MasterHandle } from "../../../../account";

import { getFolderMeta } from "../v0/index";

const login = async (masterHandle: MasterHandle) => {
	// try older meta first
	try {
		const meta = await getFolderMeta(masterHandle, "/")

		masterHandle.createFolderMeta("/")
		masterHandle.setFolderMeta("/", meta)
	} catch (err) {
		try {
			await masterHandle.getFolderMeta("/")
		} catch (err) {
			console.warn(err)
			masterHandle.createFolderMeta("/")
			masterHandle.setFolderMeta("/", new FolderMeta())
		}
	}
}

export { login }
