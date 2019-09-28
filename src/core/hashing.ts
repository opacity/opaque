import { soliditySha3, Mixed } from "web3-utils"

export const hash = <T extends Mixed>(...val: T[]) => {
	return soliditySha3(...val).replace(/^0x/, "")
}
