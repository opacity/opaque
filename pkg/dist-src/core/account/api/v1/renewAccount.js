import { renewAccountStatus, renewAccountInvoice } from "../../../requests/renewAccount";
import { buildFullTree } from "./buildFullTree";
import { getFolderLocation } from "../v0/getFolderLocation";
const renewAccount = async (masterHandle, duration) => {
    const tree = await buildFullTree(masterHandle, "/");
    const metadataKeys = Object.keys(tree).map(dir => getFolderLocation(masterHandle, dir));
    const fileHandles = Object.values(tree).map(folder => folder.files.map(file => file.versions.map(version => version.handle.slice(0, 64)))).flat(2);
    console.log(metadataKeys, fileHandles);
    const renewAccountInvoiceResponse = await renewAccountInvoice(masterHandle.uploadOpts.endpoint, masterHandle, duration);
    console.log(renewAccountInvoiceResponse);
    const renewAccountStatusOpts = [
        masterHandle.uploadOpts.endpoint,
        masterHandle,
        metadataKeys,
        fileHandles,
        duration
    ];
    return {
        data: renewAccountInvoiceResponse.data,
        waitForPayment: () => new Promise(resolve => {
            const interval = setInterval(async () => {
                // don't perform run if it takes more than 5 seconds for response
                const time = Date.now();
                const renewAccountStatusResponse = await renewAccountStatus(...renewAccountStatusOpts);
                console.log(renewAccountStatusResponse);
                if (renewAccountStatusResponse.data.status
                    && renewAccountStatusResponse.data.status !== "Incomplete"
                    && time + 5 * 1000 > Date.now()) {
                    clearInterval(interval);
                    await masterHandle.login();
                    resolve({ data: renewAccountStatusResponse.data });
                }
            }, 10 * 1000);
        })
    };
};
export { renewAccount };
