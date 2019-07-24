import { deleteFile as requestDeleteFile } from "../../../../core/requests/deleteFile";
const deleteFile = async (masterHandle, dir, name) => {
    const meta = await masterHandle.getFolderMeta(dir);
    const file = meta.files.filter(file => file.type == "file")
        .find((file) => file.name == name);
    const versions = Object.assign([], file.versions);
    try {
        await Promise.all(versions.map(async (version) => {
            const deleted = await requestDeleteFile(masterHandle.uploadOpts.endpoint, masterHandle, version.handle.slice(0, 64));
            file.versions = file.versions.filter(v => v != version);
            return deleted;
        }));
        meta.files = meta.files.filter(f => f != file);
    }
    catch (err) {
        console.error(err);
        throw err;
    }
    return await masterHandle.setFolderMeta(dir, meta);
};
export { deleteFile };
