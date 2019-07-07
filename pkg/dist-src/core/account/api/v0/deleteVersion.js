import { deleteFile as requestDeleteFile } from "../../../../core/requests/deleteFile";
const deleteVersion = async (masterHandle, dir, handle) => {
    const meta = await masterHandle.getFolderMeta(dir);
    const file = meta.files.filter(file => file.type == "file")
        .find((file) => !!file.versions.find(version => version.handle == handle));
    await requestDeleteFile(masterHandle.uploadOpts.endpoint, masterHandle, handle.slice(0, 64));
    file.versions = file.versions.filter(version => version.handle != handle);
    return await masterHandle.setFolderMeta(dir, meta);
};
export { deleteVersion };
