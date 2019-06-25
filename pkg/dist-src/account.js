import { generateMnemonic, mnemonicToSeedSync, validateMnemonic, } from "bip39";
import HDKey, { fromMasterSeed } from "hdkey";
import * as namehash from "eth-ens-namehash";
import Upload from "./upload";
import Download from "./download";
import { EventEmitter } from "events";
import { debounce } from "debounce";
import { hash } from "./core/hashing";
import { decrypt, encryptString } from "./core/encryption";
import { util as ForgeUtil } from "node-forge";
import { FolderMeta, MinifiedFolderMeta, FileEntryMeta, FileVersion, FolderEntryMeta } from "./core/account/metadata";
import { getMetadata, setMetadata, createMetadata, deleteMetadata, checkPaymentStatus, createAccount } from "./core/request";
import { deleteFile } from "./core/requests/deleteFile";
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
        this.generateSubHDKey = (pathString) => {
            const path = MasterHandle.hashToPath(hash(pathString), { prefix: true });
            return this.derive(path);
        };
        this.uploadFile = (dir, file) => {
            const upload = new Upload(file, this, this.uploadOpts), ee = new EventEmitter();
            Object.assign(ee, { handle: upload.handle });
            upload.on("upload-progress", progress => {
                ee.emit("upload-progress", progress);
            });
            upload.on("error", err => {
                ee.emit("error", err);
            });
            upload.on("finish", async (finishedUpload) => {
                await this.queueMeta(dir, { file, finishedUpload });
                ee.emit("finish", finishedUpload);
            });
            return ee;
        };
        this.downloadFile = (handle) => {
            return new Download(handle, this.downloadOpts);
        };
        this.deleteFile = async (dir, name) => {
            const meta = await this.getFolderMeta(dir);
            const file = meta.files.filter(file => file.type == "file")
                .find((file) => file.name == name);
            const versions = Object.assign([], file.versions);
            try {
                await Promise.all(versions.map(async (version) => {
                    const deleted = await deleteFile(this.uploadOpts.endpoint, this, version.handle.slice(0, 64));
                    file.versions = file.versions.filter(v => v != version);
                    return deleted;
                }));
                meta.files = meta.files.filter(f => f != file);
            }
            catch (err) {
                console.error(err);
                throw err;
            }
            return await this.setFolderMeta(dir, meta);
        };
        this.deleteVersion = async (dir, handle) => {
            const meta = await this.getFolderMeta(dir);
            const file = meta.files.filter(file => file.type == "file")
                .find((file) => !!file.versions.find(version => version.handle == handle));
            await deleteFile(this.uploadOpts.endpoint, this, handle.slice(0, 64));
            file.versions = file.versions.filter(version => version.handle != handle);
            return await this.setFolderMeta(dir, meta);
        };
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
        this.getFolderHDKey = (dir) => {
            return this.generateSubHDKey("folder: " + dir);
        };
        this.getFolderLocation = (dir) => {
            return hash(this.getFolderHDKey(dir).publicKey.toString("hex"));
        };
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
        this.createFolderMeta = async (dir) => {
            dir = dir.replace(/\/+/g, "/");
            try {
                // TODO: verify folder can only be changed by the creating account
                await createMetadata(this.uploadOpts.endpoint, this, 
                // this.getFolderHDKey(dir),
                this.getFolderLocation(dir));
            }
            catch (err) {
                console.error(`Can't create folder metadata for folder ${dir}`);
                throw err;
            }
        };
        this.createFolder = async (dir, name) => {
            dir = dir.replace(/\/+/g, "/");
            const fullDir = (dir + "/" + name).replace(/\/+/g, "/");
            if (name.indexOf("/") > 0 || name.length > 2 ** 8)
                throw new Error("Invalid folder name");
            const location = this.getFolderLocation(dir);
            let dirMeta = await this.getFolderMeta(dir);
            try {
                await this.getFolderMeta(fullDir);
                console.warn("Folder already exists");
                dirMeta.folders.push(new FolderEntryMeta({ name, location }));
                await this.setFolderMeta(dir, dirMeta);
                return;
            }
            catch (err) {
                console.warn(err);
            }
            await this.createFolderMeta(fullDir);
            try {
                await this.setFolderMeta(fullDir, new FolderMeta());
            }
            catch (err) {
                console.error("Failed to set folder meta for dir: " + dir);
                throw err;
            }
            try {
                dirMeta.folders.push(new FolderEntryMeta({ name, location }));
                await this.setFolderMeta(dir, dirMeta);
            }
            catch (err) {
                console.error("Failed to set folder meta for dir: " + dir);
                throw err;
            }
        };
        this.deleteFolderMeta = async (dir) => {
            // TODO: verify folder can only be changed by the creating account
            await deleteMetadata(this.uploadOpts.endpoint, this, 
            // this.getFolderHDKey(dir),
            this.getFolderLocation(dir));
        };
        this.deleteFolder = async (dir) => {
            const meta = await this.getFolderMeta(dir);
            meta.folders.forEach(folder => {
                this.deleteFolder(dir + "/" + folder);
            });
            meta.files.forEach(file => {
                this.deleteFile(dir, file.name);
            });
            deleteMetadata(this.uploadOpts.endpoint, this, this.getFolderLocation(dir));
        };
        this.setFolderMeta = async (dir, folderMeta) => {
            const folderKey = this.getFolderHDKey(dir), key = hash(folderKey.privateKey.toString("hex")), metaString = JSON.stringify(folderMeta.minify()), encryptedMeta = Buffer.from(encryptString(key, metaString, "utf8").toHex(), "hex").toString("base64");
            // TODO: verify folder can only be changed by the creating account
            await setMetadata(this.uploadOpts.endpoint, this, 
            // this.getFolderHDKey(dir),
            this.getFolderLocation(dir), encryptedMeta);
        };
        this.getFolderMeta = async (dir) => {
            const folderKey = this.getFolderHDKey(dir), location = this.getFolderLocation(dir), key = hash(folderKey.privateKey.toString("hex")), 
            // TODO: verify folder can only be read by the creating account
            response = await getMetadata(this.uploadOpts.endpoint, this, 
            // folderKey,
            location);
            try {
                // TODO
                // I have no idea why but the decrypted is correct hex without converting
                const metaString = decrypt(key, new ForgeUtil.ByteBuffer(Buffer.from(response.data.metadata, "base64"))).toString();
                try {
                    const meta = JSON.parse(metaString);
                    return new MinifiedFolderMeta(meta).unminify();
                }
                catch (err) {
                    console.error(err);
                    console.warn(metaString);
                    throw new Error("metadata corrupted");
                }
            }
            catch (err) {
                console.error(err);
                throw new Error("error decrypting meta");
            }
        };
        this.getAccountInfo = async () => ((await checkPaymentStatus(this.uploadOpts.endpoint, this)).data.account);
        this.isPaid = async () => {
            try {
                const accountInfoResponse = await checkPaymentStatus(this.uploadOpts.endpoint, this);
                return accountInfoResponse.data.paymentStatus == "paid";
            }
            catch (_a) {
                return false;
            }
        };
        this.login = async () => {
            try {
                await this.getFolderMeta("/");
            }
            catch (err) {
                console.warn(err);
                this.setFolderMeta("/", new FolderMeta());
            }
        };
        this.register = async (duration, limit) => {
            if (await this.isPaid()) {
                return Promise.resolve({
                    data: { invoice: { cost: 0, ethAddress: "0x0" } },
                    waitForPayment: async () => ({ data: (await checkPaymentStatus(this.uploadOpts.endpoint, this)).data })
                });
            }
            const createAccountResponse = await createAccount(this.uploadOpts.endpoint, this, this.getFolderLocation("/"), duration, limit);
            return new Promise(resolve => {
                resolve({
                    data: createAccountResponse.data,
                    waitForPayment: () => new Promise(resolve => {
                        const interval = setInterval(async () => {
                            // don't perform run if it takes more than 5 seconds for response
                            const time = Date.now();
                            if (await this.isPaid() && time + 5 * 1000 > Date.now()) {
                                clearInterval(interval);
                                await this.login();
                                resolve({ data: (await checkPaymentStatus(this.uploadOpts.endpoint, this)).data });
                            }
                        }, 10 * 1000);
                    })
                });
            });
        };
        this.uploadOpts = uploadOpts;
        this.downloadOpts = downloadOpts;
        if (account && account.constructor == Account) {
            const path = "m/43'/60'/1775'/0'/" + MasterHandle.hashToPath(namehash.hash("opacity.io").replace(/^0x/, ""));
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
        return this.privateKey.toString("hex") + this.chainCode.toString("hex");
    }
    static getKey(from, str) {
        return hash(from.privateKey.toString("hex"), str);
    }
}
MasterHandle.hashToPath = (h, { prefix = false } = {}) => {
    if (h.length % 4) {
        throw new Error("hash length must be multiple of two bytes");
    }
    return (prefix ? "m/" : "") + h.match(/.{1,4}/g).map(p => parseInt(p, 16)).join("'/") + "'";
};
export { Account, MasterHandle, HDKey };
