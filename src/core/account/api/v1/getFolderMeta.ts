import { util as ForgeUtil } from "node-forge";

import { hash } from "../../../../core/hashing";
import { getMetadata } from "../../../../core/requests/metadata";
import { decrypt } from "../../../../core/encryption";

import { MasterHandle } from "../../../../account";
import {
	FolderMeta,
	MinifiedFolderMeta
} from "../../../../core/account/folder-meta";

import { createMetaQueue } from "./createMetaQueue"

import { cleanPath } from "../../../../utils/cleanPath";

const getFolderMeta = async (masterHandle: MasterHandle, dir: string): Promise<FolderMeta> => {
	dir = cleanPath(dir)

	createMetaQueue(masterHandle, dir)

	const
		folderKey = masterHandle.getFolderHDKey(dir),
		location = masterHandle.getFolderLocation(dir),
		key = hash(folderKey.privateKey.toString("hex")),
		// TODO: verify folder can only be read by the creating account
		response = await getMetadata(
			masterHandle.uploadOpts.endpoint,
			masterHandle,
			// folderKey,
			location
		)

	try {
		const metaString = (
			decrypt(
				key,
				new ForgeUtil.ByteBuffer(Buffer.from(response.data.metadata, "base64"))
			) as ForgeUtil.ByteBuffer
		).toString();

		try {
			const meta = JSON.parse(metaString)

			return new MinifiedFolderMeta(meta).unminify()
		} catch (err) {
			console.error(err)
			console.info("META STRING:", metaString)

			throw new Error("metadata corrupted")
		}
	} catch (err) {
		console.error(err)

		throw new Error("error decrypting meta")
	}
}

export { getFolderMeta }
