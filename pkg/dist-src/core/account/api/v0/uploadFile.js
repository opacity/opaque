import { EventEmitter } from "events";
import Upload from "../../../../upload";
const uploadFile = (masterHandle, dir, file) => {
    const upload = new Upload(file, masterHandle, masterHandle.uploadOpts), ee = new EventEmitter();
    Object.assign(ee, { handle: upload.handle });
    upload.on("upload-progress", progress => {
        ee.emit("upload-progress", progress);
    });
    upload.on("error", err => {
        ee.emit("error", err);
    });
    upload.on("finish", async (finishedUpload) => {
        await masterHandle.queueMeta(dir, { file, finishedUpload });
        ee.emit("finish", finishedUpload);
    });
    return ee;
};
export { uploadFile };
