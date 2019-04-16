import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39"
import HDKey, { fromMasterSeed } from "hdkey"

// TODO - implement actual hashing (not here)
const hash = (buf: Buffer): Buffer => null

class Account {
  mnemonic: string

  constructor (mnemonic: string = generateMnemonic()) {
    if (!validateMnemonic(mnemonic))
      throw Error("mnemonic provided was not valid")

    this.mnemonic = mnemonic
  }

  get seed () {
    return mnemonicToSeedSync(this.mnemonic)
  }
}

class MasterHandle {
  handle: HDKey

  constructor (account: Account) {
    this.handle = fromMasterSeed(account.seed)
  }

  generateFileHandle (file: Buffer) {
    hash(Buffer.concat([this.handle.privateKey, hash(file)]))
  }
}
