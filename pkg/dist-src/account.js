import { generateMnemonic, entropyToMnemonic, mnemonicToSeedSync, validateMnemonic, } from "bip39";
import HDKey, { fromMasterSeed } from "hdkey";
import Upload from "./upload";
import Download from "./download";
import { EventEmitter } from "events";
import { pipe } from "./utils/pipe";
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
    constructor({ account, handle, }) {
        super();
        this.uploadFile = (dir, file) => {
            const upload = new Upload(file, this), ee = new EventEmitter();
            upload.on("progress", progress => {
                ee.emit("progress", progress);
            });
            upload.on("error", err => {
                ee.emit("error", err);
                throw err;
            });
            upload.on("finish", async ({ handle }) => {
                const folderMeta = await this.getFolderMetadata(dir), oldMetaIndex = folderMeta.files.findIndex(e => e.name == file.name && e.type == "file"), oldMeta = oldMetaIndex !== -1
                    ? folderMeta.files[oldMetaIndex]
                    : {}, version = new FileVersion({
                    size: file.size,
                    handle: handle,
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
                const metaUpload = new Upload(buf, this);
                metaUpload.on("error", err => {
                    ee.emit("error", err);
                    throw err;
                });
                metaUpload.on("finish", ({ handle: metaHandle }) => {
                    const encryptedHandle = encryptString(this.privateKey.toString("hex"), metaHandle);
                    // TODO
                    setMetadata("ENDPOINT", this.getFolderHDKey(dir), this.getFolderLocation(dir), encryptedHandle);
                });
            });
            return ee;
        };
        this.downloadFile = (handle) => {
            return new Download(handle);
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
    /**
     * creates a sub key seed for validating
     *
     * @param path - the string to use as a sub path
     */
    generateSubHDKey(path) {
        return pipe(Buffer.concat([this.privateKey, Buffer.from(hash(path), "hex")]).toString("hex")).through(hash, entropyToMnemonic, mnemonicToSeedSync, fromMasterSeed);
    }
    static getKey(from, str) {
        return hash(from.privateKey.toString("hex"), str);
    }
}
export { Account, MasterHandle };
