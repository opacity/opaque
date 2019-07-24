const removeVersion = async (metaQueue, meta, version) => {
    const file = meta.files.find(f => f.versions.includes(version) || !!f.versions.find(v => version.handle === v.handle));
    // precondition for if version no longer exists in meta
    if (!file)
        return meta;
    file.versions = file.versions.filter(v => version !== v && version.handle !== v.handle);
    if (file.versions.length === 0)
        metaQueue.push({
            type: "remove-file",
            payload: file
        });
    return meta;
};
export { removeVersion };
