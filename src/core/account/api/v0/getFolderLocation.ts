import { MasterHandle } from "~/account";
import { hash } from "~/core/hashing";

const getFolderLocation = (masterHandle: MasterHandle, dir: string) => {
	return hash(masterHandle.getFolderHDKey(dir).publicKey.toString("hex"));
}

export { getFolderLocation }
