const addFile = (metaQueue, meta, file) => {
    const existingFile = meta.files.find(f => file === f || file.name === f.name);
    if (existingFile) {
        existingFile.modified = file.modified;
        existingFile.versions = [...existingFile.versions, ...file.versions];
    }
    else {
        meta.files.push(file);
    }
    return meta;
};
export { addFile };
