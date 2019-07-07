import { hash } from "../../../../core/hashing";
import { hashToPath } from "../../../../utils/hashToPath";
const generateSubHDKey = (masterHandle, pathString) => {
    const path = hashToPath(hash(pathString), { prefix: true });
    return masterHandle.derive(path);
};
export { generateSubHDKey };
