import { checkPaymentStatus } from "../../../../core/requests/checkPaymentStatus";
const getAccountInfo = async (masterHandle) => ((await checkPaymentStatus(this.uploadOpts.endpoint, masterHandle)).data.account);
export { getAccountInfo };
