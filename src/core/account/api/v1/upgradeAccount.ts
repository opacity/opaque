import { upgradeAccountStatus, upgradeAccountInvoice } from "../../../requests/upgradeAccount";
import { buildFullTree } from "./buildFullTree";

import { MasterHandle } from "../../../../account";
import { getFolderLocation } from "../v0/getFolderLocation";

const upgradeAccount = async (masterHandle: MasterHandle, duration?: number, limit?: number) => {
	const tree = await buildFullTree(masterHandle, "/")

	const metadataKeys = Object.keys(tree).map(dir => getFolderLocation(masterHandle, dir))
	const fileHandles = Object.values(tree).map(folder => folder.files.map(file => file.versions.map(version => version.handle.slice(0, 64)))).flat(2)

	console.log(metadataKeys, fileHandles)

	const upgradeAccountInvoiceResponse = await upgradeAccountInvoice(masterHandle.uploadOpts.endpoint, masterHandle, duration, limit)

	console.log(upgradeAccountInvoiceResponse)

	const upgradeAccountStatusOpts: [
		string,
		MasterHandle,
		string[],
		string[],
		number,
		number
	] = [
		masterHandle.uploadOpts.endpoint,
		masterHandle,
		metadataKeys,
		fileHandles,
		duration,
		limit
	]

	return {
		data: upgradeAccountInvoiceResponse.data,
		waitForPayment: () => new Promise(resolve => {
			const interval = setInterval(async () => {
				// don't perform run if it takes more than 5 seconds for response
				const time = Date.now()

				const upgradeAccountStatusResponse = await upgradeAccountStatus(...upgradeAccountStatusOpts)

				console.log(upgradeAccountStatusResponse)

				if (
					upgradeAccountStatusResponse.data.status
					&& upgradeAccountStatusResponse.data.status !== "Incomplete"
					&& time + 5 * 1000 > Date.now()
				) {
					clearInterval(interval)

					await masterHandle.login()

					resolve({ data: upgradeAccountStatusResponse.data })
				}
			}, 10 * 1000)
		})
	}
}

export { upgradeAccount }
