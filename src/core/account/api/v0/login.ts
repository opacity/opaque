import { FolderMeta } from "../../../../core/account/folder-meta";
import { MasterHandle } from "../../../../account";

const login = async (masterHandle: MasterHandle) => {
	try {
		await masterHandle.getFolderMeta("/")
	} catch (err) {
		console.warn(err)
		masterHandle.setFolderMeta("/", new FolderMeta())
	}
}

export { login }
