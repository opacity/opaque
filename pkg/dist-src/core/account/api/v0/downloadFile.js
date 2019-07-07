import Download from "../../../../download";
const downloadFile = (masterHandle, handle) => {
    return new Download(handle, this.downloadOpts);
};
export { downloadFile };
