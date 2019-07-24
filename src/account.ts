import {
  generateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from "bip39"
import HDKey, { fromMasterSeed } from "hdkey"
import * as namehash from "eth-ens-namehash"

import { hashToPath } from "./utils/hashToPath"
import { hash } from "./core/hashing"

import { NetQueue } from "./utils/netQueue"

import {
  FolderMeta,
  FileEntryMeta,
  FileVersion,
  FolderEntryMeta
} from "./core/account/metadata"

import {
  getFolderHDKey,
  uploadFile,
  deleteFile,
  deleteVersion,
  downloadFile,
  getFolderLocation,
  createFolderMeta,
  createFolder,
  deleteFolderMeta,
  deleteFolder,
  setFolderMeta,
  getFolderMeta,
  getAccountInfo,
  isPaid,
  login,
  register,
  generateSubHDKey,
  getHandle
} from "./core/account/api/v1/index"

import { RequireOnlyOne } from "./types/require-only-one"

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
    [key: string]: NetQueue<FolderMeta>
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
      const path = "m/43'/60'/1775'/0'/" + hashToPath(namehash.hash("opacity.io").replace(/^0x/, ""))

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
    return getHandle(this)
  }

  /**
   * creates a sub key seed for validating
   *
   * @param path - the string to use as a sub path
   */
  private generateSubHDKey = (pathString: string): HDKey =>
    generateSubHDKey(this, pathString)

  uploadFile = (dir: string, file: File) =>
    uploadFile(this, dir, file)

  downloadFile = (handle: string) =>
    downloadFile(this, handle)

  deleteFile = (dir: string, file: FileEntryMeta) =>
    deleteFile(this, dir, file)

  deleteVersion = (dir: string, version: FileVersion) =>
    deleteVersion(this, dir, version)

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
  getFolderHDKey = (dir: string) =>
    getFolderHDKey(this, dir)

  getFolderLocation = (dir: string) =>
    getFolderLocation(this, dir)

  createFolderMeta = async (dir: string) =>
    createFolderMeta(this, dir)

  createFolder = async (dir: string, name: string) =>
    createFolder(this, dir, name)

  deleteFolderMeta = async (dir: string) =>
    deleteFolderMeta(this, dir)

  deleteFolder = async (dir: string, folder: FolderEntryMeta) =>
    deleteFolder(this, dir, folder)

  setFolderMeta = async (dir: string, folderMeta: FolderMeta) =>
    setFolderMeta(this, dir, folderMeta)

  getFolderMeta = async (dir: string): Promise<FolderMeta> =>
    getFolderMeta(this, dir)

  getAccountInfo = async () =>
    getAccountInfo(this)

  isPaid = async () =>
    isPaid(this)

  login = async () =>
    login(this)

  register = async (duration?: number, limit?: number) =>
    register(this, duration, limit)
}

export { Account, MasterHandle, HDKey };
