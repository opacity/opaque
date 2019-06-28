import { hash } from "~/core/hashing";
const getFolderLocation = (masterHandle, dir) => {
    return hash(masterHandle.getFolderHDKey(dir).publicKey.toString("hex"));
};
export { getFolderLocation };
