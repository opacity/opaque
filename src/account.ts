import {
  generateMnemonic,
  entropyToMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from "bip39";
import HDKey, { fromMasterSeed } from "hdkey";

import Upload from "./upload";
import Download from "./download";
import { EventEmitter } from "events";
import { pipe } from "./utils/pipe";
import { hash } from "./core/hashing";
import { decryptString, encryptString } from "./core/encryption";
import {
  FolderMeta,
  FileEntryMeta,
  FileVersion,
} from "./core/account/metadata";
import { getMetadata, setMetadata } from "./core/requests/metadata";

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
  >) {
    super();

    if (account && account.constructor == Account) {
      // TODO: fill in path
      // ethereum/EIPs#1775 is very close to ready, it would be better to use it instead
      Object.assign(
        this,
        fromMasterSeed(account.seed).derive("m/43'/60'/1775'/0'/path")
      );
    } else if (handle && handle.constructor == String) {
      this.privateKey = Buffer.from(handle, "hex");
    } else {
      throw new Error("master handle was not of expected type");
    }
  }

  /**
   * creates a sub key seed for validating
   *
   * @param path - the string to use as a sub path
   */
  private generateSubHDKey(path: string): HDKey {
    return pipe(
      Buffer.concat([this.privateKey, Buffer.from(hash(path), "hex")]).toString(
        "hex"
      )
    ).through(hash, entropyToMnemonic, mnemonicToSeedSync, fromMasterSeed);
  }

  uploadFile = (dir: string, file: File) => {
    const upload = new Upload(file, this),
      ee = new EventEmitter();

    upload.on("progress", progress => {
      ee.emit("progress", progress);
    });

    upload.on("error", err => {
      ee.emit("error", err);
      throw err;
    });

    upload.on("finish", async (finishedUpload: { handle: string, [key: string]: any }) => {
      const folderMeta = await this.getFolderMetadata(dir),
        oldMetaIndex = folderMeta.files.findIndex(
          e => e.name == file.name && e.type == "file"
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
            (oldMeta.versions || []).unshift(version) && oldMeta.versions,
        });

      // metadata existed previously
      if (oldMetaIndex !== -1) folderMeta.files.splice(oldMetaIndex, 1, meta);
      else folderMeta.files.unshift(meta);

      const buf = Buffer.from(JSON.stringify(folderMeta));

      const metaUpload = new Upload(buf, this);

      metaUpload.on("error", err => {
        ee.emit("error", err);
        throw err;
      });

      metaUpload.on("finish", async ({ handle: metaHandle }: { handle: string }) => {
        const encryptedHandle = encryptString(
          this.privateKey.toString("hex"),
          metaHandle
        );

        // TODO
        await setMetadata(
          "ENDPOINT",
          this.getFolderHDKey(dir),
          this.getFolderLocation(dir),
          encryptedHandle
        );

        ee.emit("finish", finishedUpload)
      });
    });

    return ee;
  }

  downloadFile = (handle: string) => {
    return new Download(handle);
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
    const folderKey = this.getFolderHDKey(dir),
      location = this.getFolderLocation(dir),
      key = hash(folderKey.privateKey.toString("hex"));

    // TODO
    const metaLocation = decryptString(
      key,
      (await getMetadata("ENDPOINT", folderKey, location)) as any,
      "hex"
    );

    return metaLocation + MasterHandle.getKey(this, metaLocation);
  }

  getFolderMetadata = async (dir: string) => {
    const handle = await this.getFolderHandle(dir);

    const meta: FolderMeta = await new Promise((resolve, reject) => {
      new Download(handle)
        .on("finish", text => resolve(JSON.parse(text)))
        .on("error", reject);
    });

    return meta;
  }
}

export { Account, MasterHandle };
