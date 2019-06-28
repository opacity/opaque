import Download from "~/download";

import { MasterHandle } from "~/account";

const downloadFile = (masterHandle: MasterHandle, handle: string) => {
	return new Download(handle, this.downloadOpts);
}

export { downloadFile }