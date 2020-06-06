import { checkPaymentStatus } from "../../../../core/requests/checkPaymentStatus";
const isExpired = async (masterHandle) => {
    try {
        const accountInfoResponse = await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle);
        return accountInfoResponse.data.paymentStatus == "expired";
    }
    catch {
        return false;
    }
};
export { isExpired };
