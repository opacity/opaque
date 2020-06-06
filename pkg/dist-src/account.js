import { generateMnemonic, mnemonicToSeedSync, validateMnemonic, } from "bip39";
import HDKey, { fromMasterSeed } from "hdkey";
import * as namehash from "eth-ens-namehash";
import { hashToPath } from "./utils/hashToPath";
import { buildFullTree, createFolder, createFolderMeta, deleteFile, deleteFolder, deleteFolderMeta, deleteVersion, downloadFile, generateSubHDKey, getAccountInfo, getFolderHDKey, getFolderLocation, getFolderMeta, getHandle, isExpired, isPaid, login, moveFile, moveFolder, register, renameFile, renameFolder, renewAccount, setFolderMeta, uploadFile, upgradeAccount } from "./core/account/api/v1/index";
/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for representing the account mnemonic
 *
 * @public
 */
class Account {
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
    get mnemonic() {
        return this._mnemonic.trim().split(/\s+/g);
    }
    get seed() {
        return mnemonicToSeedSync(this._mnemonic);
    }
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
    /**
     * creates a master handle from an account
     *
     * @param _ - the account to generate the handle from
     * @param _.account - an {@link Account}
     * @param _.handle - an account handle as a string
     */
    constructor({ account, handle, }, { uploadOpts = {}, downloadOpts = {} } = {}) {
        super();
        this.metaQueue = {};
        this.metaFolderCreating = {};
        /**
         * creates a sub key seed for validating
         *
         * @param path - the string to use as a sub path
         */
        this.generateSubHDKey = (pathString) => generateSubHDKey(this, pathString);
        this.uploadFile = (dir, file) => uploadFile(this, dir, file);
        this.downloadFile = (handle) => downloadFile(this, handle);
        /**
         * deletes every version of a file and removes it from the metadata
         *
         * @param dir - the containing folder
         * @param file - file entry to delete (loosely matched name)
         */
        this.deleteFile = (dir, file) => deleteFile(this, dir, file);
        /**
         * deletes a single version of a file (ie. delete by handle)
         *
         * @param dir - the containing folder
         * @param version - version to delete (loosely matched by handle)
         */
        this.deleteVersion = (dir, version) => deleteVersion(this, dir, version);
        /**
         * creates a dir key seed for validating and folder navigation
         *
         * @param dir - the folder
         */
        this.getFolderHDKey = (dir) => getFolderHDKey(this, dir);
        /**
         * get the location (ie. metadata id) of a folder
         *
         * @remarks this is a deterministic location derived from the account's hdkey to allow for random folder access
         *
         * @param dir - the folder to locate
         */
        this.getFolderLocation = (dir) => getFolderLocation(this, dir);
        /**
         * request the creation of a folder metadata
         *
         * @param dir - the folder to create
         */
        this.createFolderMeta = async (dir) => createFolderMeta(this, dir);
        /**
         * create folder {name} inside of {dir}
         *
         * @param dir - the containing folder
         * @param name - the name of the new folder
         */
        this.createFolder = async (dir, name) => createFolder(this, dir, name);
        this.deleteFolderMeta = async (dir) => deleteFolderMeta(this, dir);
        this.deleteFolder = async (dir, folder) => deleteFolder(this, dir, folder);
        this.moveFile = async (dir, { file, to }) => moveFile(this, dir, { file, to });
        this.moveFolder = async (dir, { folder, to }) => moveFolder(this, dir, { folder, to });
        this.renameFile = async (dir, { file, name }) => renameFile(this, dir, { file, name });
        this.renameFolder = async (dir, { folder, name }) => renameFolder(this, dir, { folder, name });
        this.setFolderMeta = async (dir, folderMeta) => setFolderMeta(this, dir, folderMeta);
        this.getFolderMeta = async (dir) => getFolderMeta(this, dir);
        /**
         * recursively build full file tree starting from directory {dir}
         *
         * @param dir - the starting directory
         */
        this.buildFullTree = async (dir) => buildFullTree(this, dir);
        this.getAccountInfo = async () => getAccountInfo(this);
        this.isExpired = async () => isExpired(this);
        this.isPaid = async () => isPaid(this);
        this.login = async () => login(this);
        this.register = async (duration, limit) => register(this, duration, limit);
        this.upgrade = async (duration, limit) => upgradeAccount(this, duration, limit);
        this.renew = async (duration) => renewAccount(this, duration);
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
    /**
     * get the account handle
     */
    get handle() {
        return getHandle(this);
    }
}
export { Account, MasterHandle, HDKey };
