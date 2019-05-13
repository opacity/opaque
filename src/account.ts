import { generateMnemonic, entropyToMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39"
import HDKey, { fromMasterSeed } from "hdkey"

import Upload from "./upload"
import Download from "./download"
import { EventEmitter } from "events"
import { pipe } from "./utils/pipe"
import { hash } from "./core/hashing"
import { decryptString } from "./core/encryption"
import { FolderMeta, FileEntryMeta, FileVersion } from "./core/account/metadata"

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
   * creates a sub key seed for validating
   *
   * @param path - the string to use as a sub path
   */
  private generateSubHDKey (path: string): HDKey {
    return (
      pipe(Buffer.concat([this.privateKey, Buffer.from(hash(path), "hex")]).toString("hex"))
        .through(
          hash,
          entropyToMnemonic,
          mnemonicToSeedSync,
          fromMasterSeed
        )
    )
  }

  uploadFile (dir: string, file: File) {
    const
      upload = new Upload(file, this),
      ee = new EventEmitter()

    upload.on("progress", progress => {
      ee.emit("progress", progress)
    })

    upload.on("error", err => {
      ee.emit("error", err)
      throw err
    })

    upload.on("finish", async h => {
      const
        folderMeta = await this.getFolderMetadata(dir),
        oldMetaIndex = folderMeta.files.findIndex(e => e.name == file.name && e.type == "file"),
        oldMeta = oldMetaIndex !== -1 ? folderMeta.files[oldMetaIndex] as FileEntryMeta : {} as FileEntryMeta,
        version = new FileVersion({
          size: file.size,
          location: h.slice(32),
          modified: file.lastModified
        }),
        meta = new FileEntryMeta({
          name: file.name,
          created: oldMeta.created,
          versions: (oldMeta.versions || []).unshift(version) && oldMeta.versions
        })

      // metadata existed previously
      if (oldMetaIndex !== -1)
        folderMeta.files.splice(oldMetaIndex, 1, meta)
      else
        folderMeta.files.unshift(meta)

      const buf = Buffer.from(JSON.stringify(folderMeta))

      const metaUpload = new Upload(buf, this)

      metaUpload.on("error", err => {
        ee.emit("error", err)
        throw err
      })

      metaUpload.on("finish", h => {
        // TODO
        requestSetFolderMeta(this.getFolderLocation(dir))
      })
    })

    return ee
  }

  /**
   * creates a file key seed for validating
   *
   * @param file - the location of the file on the network
   */
  generateFileHDKey (file: string) {
    return this.generateSubHDKey("file: " + file)
  }

  /**
   * creates a dir key seed for validating and folder navigation
   *
   * @param dir - the folder path in the UI
   */
  getFolderHDKey (dir: string) {
    return this.generateSubHDKey("folder: " + dir)
  }

  getFolderLocation (dir: string) {
    return hash(this.getFolderHDKey(dir).publicKey.toString("hex"))
  }

  generateKey (str: string) {
    return hash(this.privateKey.toString("hex"), str)
  }

  async getFolderHandle (dir: string) {
    const
      folderKey = this.getFolderHDKey(dir),
      location = this.getFolderLocation(dir),
      key = hash(folderKey.privateKey.toString("hex"))

    // TODO
    const metaLocation = decryptString(key, await requestGetFolderMeta(location), "hex")

    return metaLocation + this.generateKey(metaLocation)
  }

  async getFolderMetadata (dir: string) {
    const handle = await this.getFolderHandle(dir)

    const meta: FolderMeta = await new Promise((resolve, reject) => {
      new Download(handle)
        .on("finish", text => resolve(JSON.parse(text)))
        .on("error", reject)
    })

    return meta
  }
}

export {
  Account,
  MasterHandle
}
