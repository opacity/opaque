import { EventEmitter } from "events";
import { Upload } from "../../../../upload";

import { MasterHandle } from "../../../../account";
import { FileEntryMeta } from "../../file-entry";
import { FileVersion } from "../../file-version";
import { createMetaQueue } from "./createMetaQueue";
import { getFolderMeta } from "./getFolderMeta";
import { createFolder } from "./createFolder";

import { posix } from "path-browserify";
import { cleanPath } from "../../../../utils/cleanPath";
import { bytesToHex } from "../../../../utils/hex";
import { polyfillReadableStream } from "../../../../utils/polyfillStream";

type EE = EventEmitter & {
	handle: string
}

const uploadFile = async (masterHandle: MasterHandle, dir: string, file: File) => {
	dir = cleanPath(dir)

	const
		upload = new Upload({
			config: {
				crypto: masterHandle.crypto,
				network: masterHandle.net,
				storageNode: masterHandle.uploadOpts.endpoint,
				metadataNode: masterHandle.uploadOpts.endpoint,
			},
			name: file.name,
			size: file.size,
			type: file.type,
		}),
		ee = new EventEmitter() as EE;

	await upload.generateHandle()

	const handle = bytesToHex(new Uint8Array([...upload._location, ...upload._key]))

	ee.handle = handle

	upload.addEventListener("upload-progress", (progress: ProgressEvent) => {
		ee.emit("upload-progress", { progress: progress.loaded / progress.total });
	});

	upload.addEventListener("error", err => {
		ee.emit("error", err);
	});

	upload.finish().then(async () => {
		if (!await getFolderMeta(masterHandle, dir).catch(console.warn))
			await createFolder(masterHandle, posix.dirname(dir), posix.basename(dir))

		createMetaQueue(masterHandle, dir)
		masterHandle.metaQueue[dir].push({
			type: "add-file",
			payload: new FileEntryMeta({
				name: file.name,
				modified: file.lastModified,
				versions: [
					new FileVersion({
						handle,
						size: file.size,
						modified: file.lastModified
					})
				]
			})
		})

		masterHandle.metaQueue[dir].once("update", meta => {
			ee.emit("finish", { handle })
		})
	})

	const stream = await upload.start()
	polyfillReadableStream<Uint8Array>(file.stream()).pipeThrough(stream)

	return ee
}

export { uploadFile }
