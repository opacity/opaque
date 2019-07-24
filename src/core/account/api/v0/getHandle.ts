import { MasterHandle } from "../../../../account";

const getHandle = (masterHandle: MasterHandle) => {
	return masterHandle.privateKey.toString("hex") + masterHandle.chainCode.toString("hex")
}

export { getHandle }
