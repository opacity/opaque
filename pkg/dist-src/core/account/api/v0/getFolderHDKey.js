import { generateSubHDKey } from "./generateSubHDKey";
const getFolderHDKey = (masterHandle, dir) => {
    return generateSubHDKey(masterHandle, "folder: " + dir);
};
export { getFolderHDKey };
