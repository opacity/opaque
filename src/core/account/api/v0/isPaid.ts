import { checkPaymentStatus } from "../../../../core/requests/checkPaymentStatus";
import { MasterHandle } from "../../../../account";

const isPaid = async (masterHandle: MasterHandle) => {
	try {
		const accountInfoResponse = await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)

		return accountInfoResponse.data.paymentStatus == "paid"
	} catch {
		return false
	}
}

export { isPaid }
