import { checkPaymentStatus } from "../../../../core/requests/checkPaymentStatus";

import { MasterHandle } from "../../../../account";

const getAccountInfo = async (masterHandle: MasterHandle) => (
	(await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data.account
)

export { getAccountInfo }
