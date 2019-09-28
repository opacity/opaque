import { checkPaymentStatus } from "../../../../core/requests/checkPaymentStatus";
const isPaid = async (masterHandle) => {
    try {
        const accountInfoResponse = await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle);
        return accountInfoResponse.data.paymentStatus == "paid";
    }
    catch {
        return false;
    }
};
export { isPaid };
