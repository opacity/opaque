import { generateSubHDKey } from "./generateSubHDKey";
import { cleanPath } from "../../../../utils/cleanPath";
const getFolderHDKey = (masterHandle, dir) => {
    dir = cleanPath(dir);
    return generateSubHDKey(masterHandle, "folder: " + dir);
};
export { getFolderHDKey };
