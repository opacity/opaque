import { soliditySha3, Mixed } from "web3-utils"

export const hash = (...val: Mixed[]) => {
	return soliditySha3(...val).replace(/^0x/, "")
}
