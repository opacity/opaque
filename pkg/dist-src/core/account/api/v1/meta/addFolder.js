const addFolder = (metaQueue, meta, folder) => {
    const existingFolder = meta.folders.find(f => folder === f || folder.name === f.name);
    if (!existingFolder)
        meta.folders.push(folder);
    return meta;
};
export { addFolder };
