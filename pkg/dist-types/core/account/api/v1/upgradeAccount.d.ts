import { MasterHandle } from "../../../../account";
declare const upgradeAccount: (masterHandle: MasterHandle, duration?: number, limit?: number) => Promise<{
    data: any;
    waitForPayment: () => Promise<unknown>;
}>;
export { upgradeAccount };
