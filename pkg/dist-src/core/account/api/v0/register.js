import { checkPaymentStatus } from "../../../../core/requests/checkPaymentStatus";
import { createAccount } from "../../../../core/requests/createAccount";
const register = async (masterHandle, duration, limit) => {
    if (await masterHandle.isPaid()) {
        return {
            data: { invoice: { cost: 0, ethAddress: "0x0" } },
            waitForPayment: async () => ({ data: (await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data })
        };
    }
    const createAccountResponse = await createAccount(masterHandle.uploadOpts.endpoint, masterHandle, masterHandle.getFolderLocation("/"), duration, limit);
    return {
        data: createAccountResponse.data,
        waitForPayment: () => new Promise(resolve => {
            const interval = setInterval(async () => {
                // don't perform run if it takes more than 5 seconds for response
                const time = Date.now();
                if (await masterHandle.isPaid() && time + 5 * 1000 > Date.now()) {
                    clearInterval(interval);
                    await masterHandle.login();
                    resolve({ data: (await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data });
                }
            }, 10 * 1000);
        })
    };
};
export { register };
