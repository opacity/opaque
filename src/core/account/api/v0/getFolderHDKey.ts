import { MasterHandle } from "../../../../account";
import { generateSubHDKey } from "./generateSubHDKey";

import { cleanPath } from "../../../../utils/cleanPath";

const getFolderHDKey = (masterHandle: MasterHandle, dir: string) => {
	dir = cleanPath(dir)

	return generateSubHDKey(masterHandle, "folder: " + dir);
}

export { getFolderHDKey }
