import {
  generateMnemonic,
  entropyToMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from "bip39";
import HDKey, { fromMasterSeed } from "hdkey";
import * as namehash from "eth-ens-namehash"

import Upload from "./upload";
import Download from "./download";
import { EventEmitter } from "events";
import { pipe } from "./utils/pipe";
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
    if (!validateMnemonic(mnemonic))
      throw new Error("mnemonic provided was not valid");

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
  safeToUploadMeta: { [key: string]: Promise<void> } = {}
  metadataQueue: { [key: string]: any[] } = {}

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

      // TODO: fill in path
      // ethereum/EIPs#1775 is very close to ready, it would be better to use it instead
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
    if (h.length % 4)
      throw new Error("hash length must be multiple of two bytes")

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
      this.metadataQueue[dir] = this.metadataQueue[dir] || []
      this.metadataQueue[dir].push({
        file,
        finishedUpload
      })

      const metaUpload = await this.processMetaQueue(dir)

      metaUpload.on("error", err => {
        ee.emit("error", err);
        throw err;
      });

      metaUpload.on("finish", () => {
        ee.emit("finish", finishedUpload)
      });
    });

    return ee;
  }

  processMetaQueue = async (dir: string) => {
    await (this.safeToUploadMeta[dir] || Promise.resolve(true))

    let resolve
    const promise = new Promise<void>(resolvePromise => { resolve = resolvePromise })

    this.safeToUploadMeta[dir] = promise

    const ee = new EventEmitter()

    if (this.metadataQueue[dir].length == 0) {
      console.log("nothing left in queue")
      resolve()
      setTimeout(() => { ee.emit("finish") }, 100)
      return ee
    }

    const copy = Object.assign([], this.metadataQueue[dir])

    console.log("uploading meta")

    const folderMeta = await this.getFolderMetadata(dir)

    await Promise.all(
      copy.map(async ({ file, finishedUpload }) => {
        const
          oldMetaIndex = folderMeta.files.findIndex(
            e => e.type == "file" && e.name == file.name
          ),
          oldMeta =
            oldMetaIndex !== -1
              ? (folderMeta.files[oldMetaIndex] as FileEntryMeta)
              : ({} as FileEntryMeta),
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
          });

        // metadata existed previously
        if (oldMetaIndex !== -1) folderMeta.files.splice(oldMetaIndex, 1, meta);
        else folderMeta.files.unshift(meta);
      })
    )

    this.metadataQueue[dir].splice(0, copy.length)

    resolve()

    console.log("meta uploaded")

    return this.uploadFolderMeta(dir, folderMeta)
  }

  downloadFile = (handle: string) => {
    return new Download(handle, this.downloadOpts);
  };

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

  getFolderHandle = async (dir: string) => {
    const
      folderKey = this.getFolderHDKey(dir),
      location = this.getFolderLocation(dir),
      key = hash(folderKey.privateKey.toString("hex")),
      response = await getMetadata(this.uploadOpts.endpoint, folderKey, location)

    // TODO
    // I have no idea why but the decrypted is correct hex without converting
    const metaLocation = (
      decrypt(
        key,
        new ForgeUtil.ByteBuffer(Buffer.from(response.data.metadata, "hex"))
      ) as ForgeUtil.ByteBuffer
    ).toString();

    return metaLocation + MasterHandle.getKey(this, metaLocation as unknown as string);
  }

  uploadFolderMeta = (dir: string, folderMeta: FolderMeta) => {
    const ee = new EventEmitter()

    const file = new File([Buffer.from(JSON.stringify(folderMeta))], "metadata_" + dir);
    const folderKey = this.getFolderHDKey(dir);

    const metaUpload = new Upload(file, this, this.uploadOpts);

    metaUpload.on("error", err => {
      ee.emit("error", err);
      throw err;
    });

    metaUpload.on("finish", async (finishedMeta: { handle: string, [key: string]: any }) => {
      const encryptedHandle = encryptString(
        hash(folderKey.privateKey.toString("hex")),
        finishedMeta.handle
      ).toHex();

      // TODO
      await setMetadata(
        this.uploadOpts.endpoint,
        this.getFolderHDKey(dir),
        this.getFolderLocation(dir),
        encryptedHandle
      );

      ee.emit("finish", finishedMeta)
    });

    return ee
  }

  getFolderMetadata = async (dir: string) => {
    let handle

    try {
      handle = await this.getFolderHandle(dir);
    } catch (err) {
      console.warn(err)

      return new FolderMeta()
    }

    const download = new Download(handle, Object.assign({}, this.downloadOpts, { autoStart: true }));

    download.on("error", console.error);

    const reader = new FileReader()
    reader.readAsBinaryString(await download.toFile() as File)
    await new Promise(resolve => { reader.onloadend = resolve })
    const meta = JSON.parse(reader.result as string)

    return meta;
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
    if (await this.isPaid())
      return Promise.resolve({
        data: { invoice: { cost: 0, ethAddress: "0x0" } },
        waitForPayment: async () => ({ data: (await checkPaymentStatus(this.uploadOpts.endpoint, this)).data })
      })

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



              resolve({ data: (await checkPaymentStatus(this.uploadOpts.endpoint, this)).data })
            }
          }, 10 * 1000)
        })
      })
    })
  }
}

export { Account, MasterHandle, HDKey };
