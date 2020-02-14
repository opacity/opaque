import { getFolderMeta } from "./getFolderMeta";
import { posix } from "path-browserify";
import { cleanPath } from "../../../../utils/cleanPath";
const buildFullTree = async (masterHandle, dir = "/") => {
    dir = cleanPath(dir);
    const tree = {};
    tree[dir] = await getFolderMeta(masterHandle, dir);
    await Promise.all(tree[dir].folders.map(async (folder) => {
        Object.assign(tree, await buildFullTree(masterHandle, posix.join(dir, folder.name)));
    }));
    return tree;
};
export { buildFullTree };
