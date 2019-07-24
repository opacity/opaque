import Download from "../../../../download";

import { MasterHandle } from "../../../../account";

const downloadFile = (masterHandle: MasterHandle, handle: string) => {
	return new Download(handle, masterHandle.downloadOpts);
}

export { downloadFile }