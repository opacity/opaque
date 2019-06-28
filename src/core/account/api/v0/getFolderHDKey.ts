import { MasterHandle } from "~/account";
import { generateSubHDKey } from "./generateSubHDKey";


const getFolderHDKey = (masterHandle: MasterHandle, dir: string) => {
	return generateSubHDKey(masterHandle, "folder: " + dir);
}

export { getFolderHDKey }
