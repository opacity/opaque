import { EventEmitter } from "events";
import Upload from "../../../../upload";

import { MasterHandle } from "../../../../account";
import { FileEntryMeta } from "../../file-entry";
import { FileVersion } from "../../file-version";
import { createMetaQueue } from "./createMetaQueue";

const uploadFile = (masterHandle: MasterHandle, dir: string, file: File) => {
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
		createMetaQueue(masterHandle, dir)
		masterHandle.metaQueue[dir].push({
			type: "add-file",
			payload: new FileEntryMeta({
				name: file.name,
				modified: file.lastModified,
				versions: [new FileVersion({ handle: finishedUpload.handle })]
			})
		})

		masterHandle.metaQueue[dir].once("update", meta => {
			ee.emit("finish", finishedUpload)
		})
	})

	return ee
}

export { uploadFile }
