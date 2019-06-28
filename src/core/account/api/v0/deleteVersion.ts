import { deleteFile as requestDeleteFile } from "~/core/requests/deleteFile"

import { MasterHandle } from "~/account"
import { FileEntryMeta } from "~/core/account/file-entry"

const deleteVersion = async (masterHandle: MasterHandle, dir: string, handle: string) => {
	const meta = await masterHandle.getFolderMeta(dir)

	const file = (meta.files.filter(file => file.type == "file") as FileEntryMeta[])
		.find((file: FileEntryMeta) => !!file.versions.find(version => version.handle == handle))

	await requestDeleteFile(masterHandle.uploadOpts.endpoint, masterHandle, handle.slice(0, 64))

	file.versions = file.versions.filter(version => version.handle != handle)

	return await masterHandle.setFolderMeta(dir, meta)
}

export { deleteVersion }
