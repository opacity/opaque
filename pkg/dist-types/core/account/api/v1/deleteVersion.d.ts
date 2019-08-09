import { MasterHandle } from "../../../../account";
import { FileVersion } from "../../file-version";
declare const deleteVersion: (masterHandle: MasterHandle, dir: string, version: FileVersion) => Promise<void>;
export { deleteVersion };
