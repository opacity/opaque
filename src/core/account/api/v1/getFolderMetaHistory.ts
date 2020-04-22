import { util as ForgeUtil } from "node-forge";

import { hash } from "../../../../core/hashing";
import { getMetadataHistory } from "../../../../core/requests/metadata";
import { decrypt } from "../../../../core/encryption";

import { MasterHandle } from "../../../../account";
import {
	FolderMeta,
	MinifiedFolderMeta
} from "../../../../core/account/folder-meta";

import { createMetaQueue } from "./createMetaQueue"

import { cleanPath } from "../../../../utils/cleanPath";

const getFolderMetaHistory = async (masterHandle: MasterHandle, dir: string): Promise<(FolderMeta | Error)[]> => {
	dir = cleanPath(dir)

	createMetaQueue(masterHandle, dir)

	const
		folderKey = masterHandle.getFolderHDKey(dir),
		location = masterHandle.getFolderLocation(dir),
		key = hash(folderKey.privateKey.toString("hex")),
		// TODO: verify folder can only be read by the creating account
		response = await getMetadataHistory(
			masterHandle.uploadOpts.endpoint,
			masterHandle,
			// folderKey,
			location
		)

	return response.data.metadataHistory.map(raw => {
		try {
			const metaString = (
				decrypt(
					key,
					new ForgeUtil.ByteBuffer(Buffer.from(raw, "base64"))
				) as ForgeUtil.ByteBuffer
			).toString();

			try {
				const meta = JSON.parse(metaString)

				return new MinifiedFolderMeta(meta).unminify()
			} catch (err) {
				console.error(err)
				console.info("META STRING:", metaString)

				return new Error("metadata corrupted")
			}
		} catch (err) {
			console.error(err)

			return new Error("error decrypting meta")
		}
	})
}

export { getFolderMetaHistory }
