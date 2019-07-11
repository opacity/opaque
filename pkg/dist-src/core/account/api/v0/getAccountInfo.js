import { checkPaymentStatus } from "../../../../core/requests/checkPaymentStatus";
const getAccountInfo = async (masterHandle) => ((await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data.account);
export { getAccountInfo };
