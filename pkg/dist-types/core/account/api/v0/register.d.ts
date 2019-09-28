import { MasterHandle } from "../../../../account";
declare const register: (masterHandle: MasterHandle, duration?: number, limit?: number) => Promise<{
    data: any;
    waitForPayment: () => Promise<unknown>;
}>;
export { register };
