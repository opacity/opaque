import { generateMnemonic, mnemonicToSeedSync, validateMnemonic, } from "bip39";
import HDKey, { fromMasterSeed } from "hdkey";
import Upload from "./upload";
import Download from "./download";
import { EventEmitter } from "events";
import { hash } from "./core/hashing";
import { decryptString, encryptString } from "./core/encryption";
import { FileEntryMeta, FileVersion, } from "./core/account/metadata";
import { getMetadata, setMetadata } from "./core/requests/metadata";
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
    constructor({ account, handle, }, { uploadOpts = {}, downloadOpts = {} }) {
        super();
        /**
         * creates a sub key seed for validating
         *
         * @param path - the string to use as a sub path
         */
        this.generateSubHDKey = (pathString) => {
            const path = MasterHandle.hashToPath(hash(pathString));
            return this.derive(path);
        };
        this.uploadFile = (dir, file) => {
            const upload = new Upload(file, this, this.uploadOpts), ee = new EventEmitter();
            upload.on("progress", progress => {
                ee.emit("progress", progress);
            });
            upload.on("error", err => {
                ee.emit("error", err);
                throw err;
            });
            upload.on("finish", async (finishedUpload) => {
                const folderMeta = await this.getFolderMetadata(dir), oldMetaIndex = folderMeta.files.findIndex(e => e.name == file.name && e.type == "file"), oldMeta = oldMetaIndex !== -1
                    ? folderMeta.files[oldMetaIndex]
                    : {}, version = new FileVersion({
                    size: file.size,
                    handle: finishedUpload.handle,
                    modified: file.lastModified,
                }), meta = new FileEntryMeta({
                    name: file.name,
                    created: oldMeta.created,
                    versions: (oldMeta.versions || []).unshift(version) && oldMeta.versions,
                });
                // metadata existed previously
                if (oldMetaIndex !== -1)
                    folderMeta.files.splice(oldMetaIndex, 1, meta);
                else
                    folderMeta.files.unshift(meta);
                const buf = Buffer.from(JSON.stringify(folderMeta));
                const metaUpload = new Upload(buf, this, this.uploadOpts);
                metaUpload.on("error", err => {
                    ee.emit("error", err);
                    throw err;
                });
                metaUpload.on("finish", async ({ handle: metaHandle }) => {
                    const encryptedHandle = encryptString(this.privateKey.toString("hex"), metaHandle);
                    // TODO
                    await setMetadata("ENDPOINT", this.getFolderHDKey(dir), this.getFolderLocation(dir), encryptedHandle);
                    ee.emit("finish", finishedUpload);
                });
            });
            return ee;
        };
        this.downloadFile = (handle) => {
            return new Download(handle, this.downloadOpts);
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
        this.getFolderHandle = async (dir) => {
            const folderKey = this.getFolderHDKey(dir), location = this.getFolderLocation(dir), key = hash(folderKey.privateKey.toString("hex"));
            // TODO
            const metaLocation = decryptString(key, (await getMetadata("ENDPOINT", folderKey, location)), "hex");
            return metaLocation + MasterHandle.getKey(this, metaLocation);
        };
        this.getFolderMetadata = async (dir) => {
            const handle = await this.getFolderHandle(dir);
            const meta = await new Promise((resolve, reject) => {
                new Download(handle)
                    .on("finish", text => resolve(JSON.parse(text)))
                    .on("error", reject);
            });
            return meta;
        };
        this.uploadOpts = uploadOpts;
        this.downloadOpts = downloadOpts;
        if (account && account.constructor == Account) {
            // TODO: fill in path
            // ethereum/EIPs#1775 is very close to ready, it would be better to use it instead
            Object.assign(this, fromMasterSeed(account.seed).derive("m/43'/60'/1775'/0'/path"));
        }
        else if (handle && handle.constructor == String) {
            this.privateKey = Buffer.from(handle, "hex");
        }
        else {
            throw new Error("master handle was not of expected type");
        }
    }
    static getKey(from, str) {
        return hash(from.privateKey.toString("hex"), str);
    }
}
MasterHandle.hashToPath = (h) => {
    if (h.length % 4)
        throw new Error("hash length must be multiple of two bytes");
    return h.match(/.{1,4}/g).map(p => parseInt(p, 16)).join("'/") + "'";
};
export { Account, MasterHandle };
