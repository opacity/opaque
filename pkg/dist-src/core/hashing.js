import { soliditySha3 } from "web3-utils";
export const hash = (...val) => {
    return soliditySha3(...val).replace(/^0x/, "");
};
