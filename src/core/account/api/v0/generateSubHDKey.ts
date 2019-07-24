import { hash } from "../../../../core/hashing";
import { hashToPath } from "../../../../utils/hashToPath";

import { MasterHandle, HDKey } from "../../../../account";

const generateSubHDKey = (masterHandle: MasterHandle, pathString: string): HDKey => {
	const path = hashToPath(hash(pathString), { prefix: true })

	return masterHandle.derive(path)
}

export { generateSubHDKey }
