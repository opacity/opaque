import Download from "../../../../download";
const downloadFile = (masterHandle, handle) => {
    return new Download(handle, masterHandle.downloadOpts);
};
export { downloadFile };
