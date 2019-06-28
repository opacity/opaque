import Upload from "~/upload";
import { EventEmitter } from "events";
import { MasterHandle } from "~/account";

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
		await masterHandle.queueMeta(dir, { file, finishedUpload })

		ee.emit("finish", finishedUpload)
	});

	return ee;
}

export { uploadFile }
