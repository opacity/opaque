const removeFolder = async (metaQueue, meta, folder) => {
    // precondition for if folder is no longer in the metadata
    if (!meta.folders.find(f => folder === f || folder.name === f.name))
        return meta;
    meta.folders = meta.folders.filter(f => folder !== f && folder.name !== f.name);
    return meta;
};
export { removeFolder };
