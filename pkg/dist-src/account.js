import { generateMnemonic, mnemonicToSeedSync, validateMnemonic, } from "bip39";
import HDKey, { fromMasterSeed } from "hdkey";
import * as namehash from "eth-ens-namehash";
import { debounce } from "debounce";
import { hashToPath } from "~/utils/hashToPath";
import { hash } from "~/core/hashing";
import { FileEntryMeta, FileVersion } from "~/core/account/metadata";
import { getFolderHDKey, uploadFile, deleteFile, deleteVersion, downloadFile, getFolderLocation, createFolderMeta, createFolder, deleteFolderMeta, deleteFolder, setFolderMeta, getFolderMeta, getAccountInfo, isPaid, login, register, generateSubHDKey, getHandle } from "~/core/account/api/v1";
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
        this.deleteFile = (dir, name) => deleteFile(this, dir, name);
        this.deleteVersion = (dir, handle) => deleteVersion(this, dir, handle);
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
        this.deleteFolder = async (dir, name) => deleteFolder(this, dir, name);
        this.setFolderMeta = async (dir, folderMeta) => setFolderMeta(this, dir, folderMeta);
        this.getFolderMeta = async (dir) => getFolderMeta(this, dir);
        this.getAccountInfo = async () => getAccountInfo(this);
        this.isPaid = async () => isPaid(this);
        this.login = async () => login(this);
        this.register = async (duration, limit) => register(this, duration, limit);
        this.queueMeta = async (dir, { file, finishedUpload }) => {
            let resolve, promise = new Promise(resolvePromise => {
                resolve = resolvePromise;
            });
            this.metaQueue[dir] = this.metaQueue[dir] || [];
            this.metaQueue[dir].push({ file, finishedUpload, resolve });
            this._updateMetaFromQueue(dir);
            await promise;
        };
        this._updateMetaFromQueue = debounce(async (dir) => {
            const folderMeta = await this.getFolderMeta(dir), copy = Object.assign([], this.metaQueue[dir]), finished = [];
            copy.forEach(({ file, finishedUpload, resolve }) => {
                const oldMetaIndex = folderMeta.files.findIndex(e => e.type == "file" && e.name == file.name), oldMeta = (oldMetaIndex !== -1
                    ? folderMeta.files[oldMetaIndex]
                    : {}), version = new FileVersion({
                    handle: finishedUpload.handle
                }), meta = new FileEntryMeta({
                    name: file.name,
                    created: oldMeta.created,
                    versions: [version, ...(oldMeta.versions || [])],
                });
                // metadata existed previously
                if (oldMetaIndex !== -1) {
                    folderMeta.files[oldMetaIndex] = meta;
                }
                else {
                    folderMeta.files.unshift(meta);
                }
                finished.push(resolve);
            });
            try {
                await this.setFolderMeta(dir, folderMeta);
            }
            catch (err) {
                console.error("could not finish setting meta");
                throw err;
            }
            // clean queue
            this.metaQueue[dir].splice(0, copy.length);
            finished.forEach(resolve => { resolve(); });
        }, 500);
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
