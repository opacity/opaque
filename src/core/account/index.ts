import { generateMnemonic, entropyToMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39"
import HDKey, { fromMasterSeed } from "hdkey"

import { pipe } from "../../utils/pipe"

// TODO: implement actual hashing (not here)
const hash = (buf: Buffer): Buffer => null

/**
 * **_this should never be shared or left in storage_**
 *
 * a class for representing the account mnemonic
 */
class Account {
  mnemonic: string

  /**
   * creates an account from a mnemonic if provided, otherwise from entropy
   *
   * @param mnemonic - the mnemonic to use for the account
   */
  constructor (mnemonic: string = generateMnemonic()) {
    if (!validateMnemonic(mnemonic))
      throw new Error("mnemonic provided was not valid")

    this.mnemonic = mnemonic
  }

  get seed () {
    return mnemonicToSeedSync(this.mnemonic)
  }
}

/**
 * **_this should never be shared or left in storage_**
 *
 * a class for creating a master handle from an account mnemonic
 *
 * a master handle is responsible for:
 *  - logging in to an account
 *  - signing changes for the account
 *  - deterministic entropy for generating features of an account (such as file keys)
 */
class MasterHandle extends HDKey {
  /**
   * creates a master handle from an account
   *
   * @param account - the account to generate the handle from
   */
  constructor (account: Account) {
    super()

    // TODO: fill in path
    // ethereum/EIPs#1175 is very close to ready, it would be better to use it instead
    Object.assign(this, fromMasterSeed(account.seed).derive("m/43'/60'/1775'/0'/path"))
  }

  /**
   * creates a file key seed for validating
   *
   * @param file - the location of the file on the network
   */
  generateFileHDKey (file: string) {
    return (
      pipe(Buffer.concat([this.privateKey, hash(Buffer.from(file, "hex"))]))
        .through(
          hash,
          entropyToMnemonic,
          mnemonicToSeedSync,
          fromMasterSeed
        )
    )
  }
}

export {
  Account,
  MasterHandle
}
