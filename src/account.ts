import {
  generateMnemonic,
  entropyToMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from "bip39";
import HDKey, { fromMasterSeed } from "hdkey";
import * as namehash from "eth-ens-namehash";
import * as EthWallet from "ethereumjs-wallet";

import Upload from "./upload";
import Download from "./download";
import { EventEmitter } from "events";
import { pipe } from "./utils/pipe";
import { debounce } from "debounce"
import { hash } from "./core/hashing";
import { decrypt, encryptString } from "./core/encryption";
import { util as ForgeUtil } from "node-forge";
import {
  FolderMeta,
  FileEntryMeta,
  FileVersion,
} from "./core/account/metadata";
import { getMetadata, setMetadata, checkPaymentStatus, createAccount } from "./core/request";

import { RequireOnlyOne } from "./types/require-only-one";
import { deleteFile } from "./core/requests/deleteFile";

/**
 * **_this should never be shared or left in storage_**
 *
 * a class for representing the account mnemonic
 */
class Account {
  private _mnemonic: string;

  get mnemonic() {
    return this._mnemonic.trim().split(/\s+/g);
  }

  /**
   * creates an account from a mnemonic if provided, otherwise from entropy
   *
   * @param mnemonic - the mnemonic to use for the account
   */
  constructor(mnemonic: string = generateMnemonic()) {
    if (!validateMnemonic(mnemonic)) {
      throw new Error("mnemonic provided was not valid");
    }

    this._mnemonic = mnemonic;
  }

  get seed() {
    return mnemonicToSeedSync(this._mnemonic);
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
  uploadOpts
  downloadOpts
  metaQueue: {
    [key: string]: {
      resolve: () => void,
      file: {
        [key: string]: any,
        name: string,
        size: number,
        lastModified: number
      },
      finishedUpload: {
        [key: string]: any,
        handle: string
      }
    }[]
  } = {}

  /**
   * creates a master handle from an account
   *
   * @param account - the account to generate the handle from
   */
  constructor({
    account,
    handle,
  }: RequireOnlyOne<
    { account: Account; handle: string },
    "account" | "handle"
  >,
  {
    uploadOpts = {},
    downloadOpts = {}
  } = {}) {
    super();

    this.uploadOpts = uploadOpts
    this.downloadOpts = downloadOpts

    if (account && account.constructor == Account) {
      const path = "m/43'/60'/1775'/0'/" + MasterHandle.hashToPath(namehash.hash("opacity.io").replace(/^0x/, ""))

      // ethereum/EIPs#1775
      Object.assign(
        this,
        fromMasterSeed(account.seed).derive(path)
      );
    } else if (handle && handle.constructor == String) {
      this.privateKey = Buffer.from(handle.slice(0, 64), "hex");
      this.chainCode = Buffer.from(handle.slice(64), "hex");
    } else {
      throw new Error("master handle was not of expected type");
    }
  }

  get handle () {
    return this.privateKey.toString("hex") + this.chainCode.toString("hex")
  }

  private static hashToPath = (h: string, { prefix = false }: { prefix?: boolean } = {}) => {
    if (h.length % 4) {
      throw new Error("hash length must be multiple of two bytes")
    }

    return (prefix ? "m/" : "") + h.match(/.{1,4}/g).map(p => parseInt(p, 16)).join("'/") + "'"
  }

  /**
   * creates a sub key seed for validating
   *
   * @param path - the string to use as a sub path
   */
  private generateSubHDKey = (pathString: string): HDKey => {
    const path = MasterHandle.hashToPath(hash(pathString), { prefix: true })

    return this.derive(path)
  }

  uploadFile = (dir: string, file: File) => {
    const
      upload = new Upload(file, this, this.uploadOpts),
      ee = new EventEmitter();

    Object.assign(ee, { handle:  upload.handle });

    upload.on("upload-progress", progress => {
      ee.emit("upload-progress", progress);
    });

    upload.on("error", err => {
      ee.emit("error", err);
      throw err;
    });

    upload.on("finish", async (finishedUpload: { handle: string, [key: string]: any }) => {
      await this.queueMeta(dir, { file, finishedUpload })

      ee.emit("finish", finishedUpload)
    });

    return ee;
  }

  downloadFile = (handle: string) => {
    return new Download(handle, this.downloadOpts);
  };

  deleteFile = async (dir: string, name: string) => {
    const meta = await this.getFolderMeta(dir)

    const file = (meta.files.filter(file => file.type == "file") as FileEntryMeta[])
      .find((file: FileEntryMeta) => file.name == name)

    const versions = Object.assign([], file.versions)

    try {
      await Promise.all(versions.map(async version => {
        const deleted = await deleteFile(this.uploadOpts.endpoint, this, version.handle.slice(0, 64))

        file.versions = file.versions.filter(v => v != version)

        return deleted
      }))

      meta.files = meta.files.filter(f => f != file)
    } catch(err) {
      console.error(err)
      throw err
    }

    return await this.setFolderMeta(dir, meta)
  }

  deleteVersion = async (dir: string, handle: string) => {
    const meta = await this.getFolderMeta(dir)

    const file = (meta.files.filter(file => file.type == "file") as FileEntryMeta[])
      .find((file: FileEntryMeta) => !!file.versions.find(version => version.handle == handle))

    await deleteFile(this.uploadOpts.endpoint, this, handle.slice(0, 64))

    file.versions = file.versions.filter(version => version.handle != handle)

    return await this.setFolderMeta(dir, meta)
  }

  static getKey(from: HDKey, str: string) {
    return hash(from.privateKey.toString("hex"), str);
  }

  /**
   * creates a file key seed for validating
   *
   * @param file - the location of the file on the network
   */
  getFileHDKey = (file: string) => {
    return this.generateSubHDKey("file: " + file);
  }

  /**
   * creates a dir key seed for validating and folder navigation
   *
   * @param dir - the folder path in the UI
   */
  getFolderHDKey = (dir: string) => {
    return this.generateSubHDKey("folder: " + dir);
  }

  getFolderLocation = (dir: string) => {
    return hash(this.getFolderHDKey(dir).publicKey.toString("hex"));
  }

  queueMeta = async (dir: string, { file, finishedUpload }) => {
    let
      resolve,
      promise = new Promise(resolvePromise => {
        resolve = resolvePromise
      })

    this.metaQueue[dir] = this.metaQueue[dir] || []
    this.metaQueue[dir].push({ file, finishedUpload, resolve })

    this._updateMetaFromQueue(dir)

    await promise
  }

  private _updateMetaFromQueue = debounce(async (dir: string) => {
    const
      folderMeta = await this.getFolderMeta(dir),
      copy = Object.assign([], this.metaQueue[dir]),
      finished: (() => void)[] = []

    copy.forEach(({ file, finishedUpload, resolve }) => {
      const
        oldMetaIndex = folderMeta.files.findIndex(
          e => e.type == "file" && e.name == file.name
        ),
        oldMeta = (
          oldMetaIndex !== -1
            ? (folderMeta.files[oldMetaIndex] as FileEntryMeta)
            : ({} as FileEntryMeta)
        ),
        version = new FileVersion({
          size: file.size,
          handle: finishedUpload.handle,
          modified: file.lastModified,
        }),
        meta = new FileEntryMeta({
          name: file.name,
          created: oldMeta.created,
          versions:
            [version, ...(oldMeta.versions || [])],
        })

      // metadata existed previously
      if (oldMetaIndex !== -1) {
        folderMeta.files[oldMetaIndex] = meta;
      } else {
        folderMeta.files.unshift(meta);
      }

      finished.push(resolve)
    })

    try {
      await this.setFolderMeta(dir, folderMeta)
    } catch (err) {
      console.error("could not finish setting meta")
      throw err
    }

    // clean queue
    this.metaQueue[dir].splice(0, copy.length)

    finished.forEach(resolve => { resolve() })
  }, 500)

  setFolderMeta = async (dir: string, folderMeta: FolderMeta) => {
    const
      folderKey = this.getFolderHDKey(dir),
      key = hash(folderKey.privateKey.toString("hex")),
      metaString = JSON.stringify(folderMeta),
      encryptedMeta = encryptString(key, metaString, "utf8").toHex()

    await setMetadata(
      this.uploadOpts.endpoint,
      this.getFolderHDKey(dir),
      this.getFolderLocation(dir),
      encryptedMeta
    );
  }

  getFolderMeta = async (dir: string): Promise<FolderMeta> => {
    const
      folderKey = this.getFolderHDKey(dir),
      location = this.getFolderLocation(dir),
      key = hash(folderKey.privateKey.toString("hex")),
      response = await getMetadata(this.uploadOpts.endpoint, folderKey, location)

    try {
      // TODO
      // I have no idea why but the decrypted is correct hex without converting
      const metaString = (
        decrypt(
          key,
          new ForgeUtil.ByteBuffer(Buffer.from(response.data.metadata, "hex"))
        ) as ForgeUtil.ByteBuffer
      ).toString();

      try {
        const meta = JSON.parse(metaString)

        return meta
      } catch (err) {
        console.error(err)

        console.log(metaString)

        throw new Error("metadata corrupted")
      }
    } catch (err) {
      console.error(err)

      throw new Error("error decrypting meta")
    }
  }

  isPaid = async () => {
    try {
      const accountInfoResponse = await checkPaymentStatus(this.uploadOpts.endpoint, this)

      return accountInfoResponse.data.paymentStatus == "paid"
    } catch {
      return false
    }
  }

  register = async () => {
    if (await this.isPaid()) {
      return Promise.resolve({
        data: { invoice: { cost: 0, ethAddress: "0x0" } },
        waitForPayment: async () => ({ data: (await checkPaymentStatus(this.uploadOpts.endpoint, this)).data })
      })
    }

    const createAccountResponse = await createAccount(this.uploadOpts.endpoint, this, this.getFolderLocation("/"))

    return new Promise(resolve => {
      resolve({
        data: createAccountResponse.data,
        waitForPayment: () => new Promise(resolve => {
          const interval = setInterval(async () => {
            // don't perform run if it takes more than 5 seconds for response
            const time = Date.now()
            if (await this.isPaid() && time + 5 * 1000 > Date.now()) {
              clearInterval(interval)

              try {
                await this.getFolderMeta("/")
              } catch (err) {
                console.warn(err)
                this.setFolderMeta("/", new FolderMeta())
              }

              resolve({ data: (await checkPaymentStatus(this.uploadOpts.endpoint, this)).data })
            }
          }, 10 * 1000)
        })
      })
    })
  }

  /**
   * creates a V3 keystore file for the master handle
   *
   * @param password - the password to encrypt the key with. make it strong!
   */
  toV3 = async (password) => {
    if(!password) {
      throw "A password is required to encrypt the keystore file.";
    }

    const wallet = EthWallet.fromPrivateKey(this.privateKey);
    const filename = wallet.getV3Filename();
    const content = wallet.toV3(password);
    const file = new File([JSON.stringify(content, null, 2)], filename);

    return file;
  }
}

export { Account, MasterHandle, HDKey };
