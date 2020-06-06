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
  buildFullTree,
  createFolder,
  createFolderMeta,
  deleteFile,
  deleteFolder,
  deleteFolderMeta,
  deleteVersion,
  downloadFile,
  generateSubHDKey,
  getAccountInfo,
  getFolderHDKey,
  getFolderLocation,
  getFolderMeta,
  getHandle,
  isExpired,
  isPaid,
  login,
  moveFile,
  MoveFileArgs,
  moveFolder,
  MoveFolderArgs,
  register,
  renameFile,
  RenameFileArgs,
  renameFolder,
  RenameFolderArgs,
  renewAccount,
  setFolderMeta,
  uploadFile,
  upgradeAccount
} from "./core/account/api/v1/index"

import { RequireOnlyOne } from "./types/require-only-one"

/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for representing the account mnemonic
 *
 * @public
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

type MasterHandleCreator = RequireOnlyOne<
  { account: Account; handle: string },
  "account" | "handle"
>

type MasterHandleOptions = {
  uploadOpts?
  downloadOpts?
}

/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for creating a master handle from an account mnemonic
 *
 * @remarks
 *
 * a master handle is responsible for:
 *  <br /> - logging in to an account
 *  <br /> - signing changes for the account
 *  <br /> - deterministic entropy for generating features of an account (such as folder keys)
 *
 * @public
 */
class MasterHandle extends HDKey {
  uploadOpts
  downloadOpts
  metaQueue: {
    [key: string]: NetQueue<FolderMeta>
  } = {}
  metaFolderCreating: {
    [key: string]: boolean
  } = {}

  /**
   * creates a master handle from an account
   *
   * @param _ - the account to generate the handle from
   * @param _.account - an {@link Account}
   * @param _.handle - an account handle as a string
   */
  constructor({
    account,
    handle,
  }: MasterHandleCreator,
  {
    uploadOpts = {},
    downloadOpts = {}
  }: MasterHandleOptions = {}) {
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

  /**
   * get the account handle
   */
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

  /**
   * deletes every version of a file and removes it from the metadata
   *
   * @param dir - the containing folder
   * @param file - file entry to delete (loosely matched name)
   */
  deleteFile = (dir: string, file: FileEntryMeta) =>
    deleteFile(this, dir, file)

  /**
   * deletes a single version of a file (ie. delete by handle)
   *
   * @param dir - the containing folder
   * @param version - version to delete (loosely matched by handle)
   */
  deleteVersion = (dir: string, version: FileVersion) =>
    deleteVersion(this, dir, version)

  /**
   * creates a dir key seed for validating and folder navigation
   *
   * @param dir - the folder
   */
  getFolderHDKey = (dir: string) =>
    getFolderHDKey(this, dir)

  /**
   * get the location (ie. metadata id) of a folder
   *
   * @remarks this is a deterministic location derived from the account's hdkey to allow for random folder access
   *
   * @param dir - the folder to locate
   */
  getFolderLocation = (dir: string) =>
    getFolderLocation(this, dir)

  /**
   * request the creation of a folder metadata
   *
   * @param dir - the folder to create
   */
  createFolderMeta = async (dir: string) =>
    createFolderMeta(this, dir)

  /**
   * create folder {name} inside of {dir}
   *
   * @param dir - the containing folder
   * @param name - the name of the new folder
   */
  createFolder = async (dir: string, name: string) =>
    createFolder(this, dir, name)

  deleteFolderMeta = async (dir: string) =>
    deleteFolderMeta(this, dir)

  deleteFolder = async (dir: string, folder: FolderEntryMeta) =>
    deleteFolder(this, dir, folder)

  moveFile = async (dir: string, { file, to }: MoveFileArgs) =>
    moveFile(this, dir, { file, to })

  moveFolder = async (dir: string, { folder, to }: MoveFolderArgs) =>
    moveFolder(this, dir, { folder, to })

  renameFile = async (dir: string, { file, name }: RenameFileArgs) =>
    renameFile(this, dir, { file, name })

  renameFolder = async (dir: string, { folder, name }: RenameFolderArgs) =>
    renameFolder(this, dir, { folder, name })

  setFolderMeta = async (dir: string, folderMeta: FolderMeta) =>
    setFolderMeta(this, dir, folderMeta)

  getFolderMeta = async (dir: string): Promise<FolderMeta> =>
    getFolderMeta(this, dir)

  /**
   * recursively build full file tree starting from directory {dir}
   *
   * @param dir - the starting directory
   */
  buildFullTree = async (dir: string): Promise<{ [dir: string]: FolderMeta }> =>
    buildFullTree(this, dir)

  getAccountInfo = async () =>
    getAccountInfo(this)

  isExpired = async () =>
    isExpired(this)

  isPaid = async () =>
    isPaid(this)

  login = async () =>
    login(this)

  register = async (duration?: number, limit?: number) =>
    register(this, duration, limit)

  upgrade = async (duration?: number, limit?: number) =>
    upgradeAccount(this, duration, limit)

  renew = async (duration?: number) =>
    renewAccount(this, duration)
}

export { Account, MasterHandle, MasterHandleCreator, MasterHandleOptions, HDKey };
