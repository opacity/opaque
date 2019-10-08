import { EventEmitter } from "events";
import Upload from "../../../../upload";

import { MasterHandle } from "../../../../account";
import { FileEntryMeta } from "../../file-entry";
import { FileVersion } from "../../file-version";
import { createMetaQueue } from "./createMetaQueue";
import { getFolderMeta } from "./getFolderMeta";
import { createFolder } from "./createFolder";

import { posix } from "path-browserify";
import { cleanPath } from "../../../../utils/cleanPath";

const uploadFile = (masterHandle: MasterHandle, dir: string, file: File) => {
	dir = cleanPath(dir)

	const
		upload = new Upload(file, masterHandle, masterHandle.uploadOpts),
		ee = new EventEmitter();

	Object.assign(ee, { handle:  upload.handle });

	upload.on("upload-progress", progress => {
		ee.emit("upload-progress", progress);
	});

	upload.on("error", err => {
		ee.emit("error", err);
	});

	upload.on("finish", async (finishedUpload: { handle: string, [key: string]: any }) => {
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
						handle: finishedUpload.handle,
						size: file.size,
						modified: file.lastModified
					})
				]
			})
		})

		masterHandle.metaQueue[dir].once("update", meta => {
			ee.emit("finish", finishedUpload)
		})
	})

	return ee
}

export { uploadFile }
