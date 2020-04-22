import { MasterHandle } from "../../../../account";
declare const renewAccount: (masterHandle: MasterHandle, duration?: number) => Promise<{
    data: any;
    waitForPayment: () => Promise<unknown>;
}>;
export { renewAccount };
