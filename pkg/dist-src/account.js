import { generateMnemonic, mnemonicToSeedSync, validateMnemonic, } from "bip39";
import HDKey, { fromMasterSeed } from "hdkey";
import * as namehash from "eth-ens-namehash";
import { hashToPath } from "./utils/hashToPath";
import { hash } from "./core/hashing";
import { getFolderHDKey, uploadFile, deleteFile, deleteVersion, downloadFile, getFolderLocation, createFolderMeta, createFolder, deleteFolderMeta, deleteFolder, setFolderMeta, getFolderMeta, getAccountInfo, isPaid, login, register, generateSubHDKey, getHandle, moveFile, moveFolder, renameFile, renameFolder } from "./core/account/api/v1/index";
/**
 * **_this should never be shared or left in storage_**
 *
 * a class for representing the account mnemonic
 */
class Account {
    get mnemonic() {
        return this._mnemonic.trim().split(/\s+/g);
    }
    /**
     * creates an account from a mnemonic if provided, otherwise from entropy
     *
     * @param mnemonic - the mnemonic to use for the account
     */
    constructor(mnemonic = generateMnemonic()) {
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
    /**
     * creates a master handle from an account
     *
     * @param account - the account to generate the handle from
     */
    constructor({ account, handle, }, { uploadOpts = {}, downloadOpts = {} } = {}) {
        super();
        this.metaQueue = {};
        /**
         * creates a sub key seed for validating
         *
         * @param path - the string to use as a sub path
         */
        this.generateSubHDKey = (pathString) => generateSubHDKey(this, pathString);
        this.uploadFile = (dir, file) => uploadFile(this, dir, file);
        this.downloadFile = (handle) => downloadFile(this, handle);
        this.deleteFile = (dir, file) => deleteFile(this, dir, file);
        this.deleteVersion = (dir, version) => deleteVersion(this, dir, version);
        /**
         * creates a file key seed for validating
         *
         * @param file - the location of the file on the network
         */
        this.getFileHDKey = (file) => {
            return this.generateSubHDKey("file: " + file);
        };
        /**
         * creates a dir key seed for validating and folder navigation
         *
         * @param dir - the folder path in the UI
         */
        this.getFolderHDKey = (dir) => getFolderHDKey(this, dir);
        this.getFolderLocation = (dir) => getFolderLocation(this, dir);
        this.createFolderMeta = async (dir) => createFolderMeta(this, dir);
        this.createFolder = async (dir, name) => createFolder(this, dir, name);
        this.deleteFolderMeta = async (dir) => deleteFolderMeta(this, dir);
        this.deleteFolder = async (dir, folder) => deleteFolder(this, dir, folder);
        this.moveFile = async (dir, { file, to }) => moveFile(this, dir, { file, to });
        this.moveFolder = async (dir, { folder, to }) => moveFolder(this, dir, { folder, to });
        this.renameFile = async (dir, { file, name }) => renameFile(this, dir, { file, name });
        this.renameFolder = async (dir, { folder, name }) => renameFolder(this, dir, { folder, name });
        this.setFolderMeta = async (dir, folderMeta) => setFolderMeta(this, dir, folderMeta);
        this.getFolderMeta = async (dir) => getFolderMeta(this, dir);
        this.getAccountInfo = async () => getAccountInfo(this);
        this.isPaid = async () => isPaid(this);
        this.login = async () => login(this);
        this.register = async (duration, limit) => register(this, duration, limit);
        this.uploadOpts = uploadOpts;
        this.downloadOpts = downloadOpts;
        if (account && account.constructor == Account) {
            const path = "m/43'/60'/1775'/0'/" + hashToPath(namehash.hash("opacity.io").replace(/^0x/, ""));
            // ethereum/EIPs#1775
            Object.assign(this, fromMasterSeed(account.seed).derive(path));
        }
        else if (handle && handle.constructor == String) {
            this.privateKey = Buffer.from(handle.slice(0, 64), "hex");
            this.chainCode = Buffer.from(handle.slice(64), "hex");
        }
        else {
            throw new Error("master handle was not of expected type");
        }
    }
    get handle() {
        return getHandle(this);
    }
    static getKey(from, str) {
        return hash(from.privateKey.toString("hex"), str);
    }
}
export { Account, MasterHandle, HDKey };
