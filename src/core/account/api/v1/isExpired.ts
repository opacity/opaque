import { checkPaymentStatus } from "../../../../core/requests/checkPaymentStatus";
import { MasterHandle } from "../../../../account";

const isExpired = async (masterHandle: MasterHandle) => {
	try {
		const accountInfoResponse = await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)

		return accountInfoResponse.data.paymentStatus == "expired"
	} catch {
		return false
	}
}

export { isExpired }
