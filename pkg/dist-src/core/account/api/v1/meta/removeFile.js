const removeFile = async (metaQueue, meta, file) => {
    // precondition for if file is no longer in the metadata
    if (!meta.files.find(f => file === f || file.name === f.name))
        return meta;
    meta.files = meta.files.filter(f => file !== f && file.name !== f.name);
    return meta;
};
export { removeFile };
