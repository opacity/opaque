import { hash } from "../../../../core/hashing";
import { encryptString } from "../../../../core/encryption";
import { setMetadata } from "../../../../core/requests/metadata";

import { MasterHandle } from "../../../../account";
import { FolderMeta } from "../../../../core/account/folder-meta";

const setFolderMeta = async (masterHandle: MasterHandle, dir: string, folderMeta: FolderMeta) => {
	const
		folderKey = masterHandle.getFolderHDKey(dir),
		key = hash(folderKey.privateKey.toString("hex")),
		metaString = JSON.stringify(folderMeta.minify()),
		encryptedMeta = Buffer.from(encryptString(key, metaString, "utf8").toHex(), "hex").toString("base64")

	// TODO: verify folder can only be changed by the creating account
	await setMetadata(
		masterHandle.uploadOpts.endpoint,
		masterHandle,
		// masterHandle.getFolderHDKey(dir),
		masterHandle.getFolderLocation(dir),
		encryptedMeta
	);
}

export { setFolderMeta }
