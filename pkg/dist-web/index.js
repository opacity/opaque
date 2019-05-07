import 'axios';
import 'events';
import { md, random, util, cipher } from 'node-forge';
import 'is-buffer';
import 'mime/lite';
import 'readable-stream';
import 'form-data';

class AccountMeta {
  constructor(_ref) {
    let planSize = _ref.planSize,
        paidUntil = _ref.paidUntil,
        _ref$preferences = _ref.preferences,
        preferences = _ref$preferences === void 0 ? {} : _ref$preferences;
    this.planSize = planSize;
    this.paidUntil = paidUntil;
    this.preferences = preferences;
  }

  setPreference(key, preference) {
    Object.assign(this.preferences[key], preference);
  }

}

class AccountPreferences {
  constructor(obj) {
    Object.assign(this, obj);
  }

}
/**
 * a metadata class to describe a file as it relates to the UI
 */


class FileEntryMeta {
  /**
   * create metadata for a file entry in the UI
   *
   * @param name - the name of the file as shown in the UI
   * @param created - the date in `ms` that this file was initially updated
   * @param hidden - if the file should be hidden (this could also be automatically generated within the UI, ie. `.files`)
   * @param locked - if the file is encrypted
     *   (will require password in the UI, may need bytes prefixed to meta to determine whether it was encrypted)
   * @param versions - versions of the uploaded file (the most recent of which should be the current version of the file)
   * @param tags - tags assigned to the file for organization/searching
   */
  constructor(_ref2) {
    let name = _ref2.name,
        _ref2$created = _ref2.created,
        created = _ref2$created === void 0 ? Date.now() : _ref2$created,
        _ref2$hidden = _ref2.hidden,
        hidden = _ref2$hidden === void 0 ? false : _ref2$hidden,
        _ref2$locked = _ref2.locked,
        locked = _ref2$locked === void 0 ? false : _ref2$locked,
        _ref2$versions = _ref2.versions,
        versions = _ref2$versions === void 0 ? [] : _ref2$versions,
        _ref2$tags = _ref2.tags,
        tags = _ref2$tags === void 0 ? [] : _ref2$tags;
    this.name = name;
    this.created = created;
    this.hidden = hidden;
    this.locked = locked;
    this.versions = versions;
    this.tags = tags;
  }

}
/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */


class FileVersion {
  /**
   * create metadata for a file version
   *
   * @param size - size in bytes of the file
   * @param location - location on the network of the file
   * @param hash - a hash of the file
     *   NOTE: probably `sha1`
   * @param modified - the date in `ms` that this version of the file was originally changed
   */
  constructor(_ref3) {
    let size = _ref3.size,
        location = _ref3.location,
        hash = _ref3.hash,
        _ref3$modified = _ref3.modified,
        modified = _ref3$modified === void 0 ? Date.now() : _ref3$modified;
    this.size = size;
    this.location = location;
    this.hash = hash;
    this.modified = modified;
  }

}
/**
 * a metadata class to describe where a folder can be found (for root metadata of an account)
 */


class FolderEntryMeta {
  /**
   * create metadata entry for a folder
   *
   * @param name - a name of the folder shown in the UI
   * @param location - the public key for the metadata file
   *   it is how the file will be queried for (using the same system as for the account metadata)
   */
  constructor(_ref4) {
    let name = _ref4.name,
        location = _ref4.location;
    this.name = name;
    this.location = location;
  }

}
/**
 * a metadata class to describe a folder for the UI
 */


class FolderMeta {
  /**
   * create metadata for a folder
   *
   * @param name - a nickname shown on the folder when accessed without adding to account metadata
   * @param files - the files included only in the most shallow part of the folder
   * @param created - when the folder was created (if not created now) in `ms`
   * @param hidden - if the folder should be hidden (this could also be automatically generated within the UI)
   * @param locked - if the folder's metadata is encrypted (will require password in the UI)
   *  NOTE: may need bytes prefixed to meta to determine whether it was encrypted
   * @param tags - tags assigned to the folder for organization/searching
   */
  constructor(_ref5) {
    let name = _ref5.name,
        _ref5$files = _ref5.files,
        files = _ref5$files === void 0 ? [] : _ref5$files,
        _ref5$created = _ref5.created,
        created = _ref5$created === void 0 ? Date.now() : _ref5$created,
        _ref5$hidden = _ref5.hidden,
        hidden = _ref5$hidden === void 0 ? false : _ref5$hidden,
        _ref5$locked = _ref5.locked,
        locked = _ref5$locked === void 0 ? false : _ref5$locked,
        _ref5$tags = _ref5.tags,
        tags = _ref5$tags === void 0 ? [] : _ref5$tags;
    this.name = name;
    this.files = files;
    this.created = created;
    this.hidden = hidden;
    this.locked = locked;
    this.tags = tags;
  }

}

const IV_BYTE_LENGTH = 16;
const TAG_BYTE_LENGTH = 16;
const DEFAULT_BLOCK_SIZE = 64 * 1024;
const BLOCK_OVERHEAD = TAG_BYTE_LENGTH + IV_BYTE_LENGTH;

const Forge = {
  md: md,
  random: random,
  util: util
};
const ByteBuffer = Forge.util.ByteBuffer; // Generate new handle, datamap entry hash and encryption key

const Forge$1 = {
  cipher: cipher,
  md: md,
  util: util,
  random: random
};
const ByteBuffer$1 = Forge$1.util.ByteBuffer; // Encryption

const DEFAULT_OPTIONS = Object.freeze({
  binaryMode: false,
  objectMode: true,
  blockSize: DEFAULT_BLOCK_SIZE
});

const DEFAULT_OPTIONS$1 = Object.freeze({
  maxParallelDownloads: 1,
  maxRetries: 0,
  partSize: 80 * (DEFAULT_BLOCK_SIZE + BLOCK_OVERHEAD),
  objectMode: false
});

const DEFAULT_OPTIONS$2 = Object.freeze({
  autoStart: true
});

const DEFAULT_OPTIONS$3 = Object.freeze({
  objectMode: false
});

const DEFAULT_OPTIONS$4 = Object.freeze({
  maxParallelUploads: 2,
  maxRetries: 0,
  partSize: 256,
  objectMode: false
});

const DEFAULT_OPTIONS$5 = Object.freeze({
  autoStart: true
});

export { AccountMeta, AccountPreferences, FileEntryMeta, FileVersion, FolderEntryMeta, FolderMeta };
