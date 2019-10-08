import { MasterHandle } from "../../../../account";
import { hash } from "../../../../core/hashing";

import { cleanPath } from "../../../../utils/cleanPath";

const getFolderLocation = (masterHandle: MasterHandle, dir: string) => {
	dir = cleanPath(dir)

	return hash(masterHandle.getFolderHDKey(dir).publicKey.toString("hex"));
}

export { getFolderLocation }
