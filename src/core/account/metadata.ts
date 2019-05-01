class AccountMeta {
  planSize: number
  paidUntil: number
  preferences: { [key: string]: AccountPreferences }

  constructor ({
    planSize,
    paidUntil,
    preferences = {}
  }: {
    planSize: number
    paidUntil: number
    preferences?: { [key: string]: AccountPreferences }
  }) {
    this.planSize = planSize
    this.paidUntil = paidUntil
    this.preferences = preferences
  }

  setPreference (key: string, preference: AccountPreferences) {
    Object.assign(this.preferences[key], preference)
  }
}

class AccountPreferences {
  constructor (obj: { [key: string]: any }) {
    Object.assign(this, obj)
  }
}

class FileEntryMeta {
  file: string
  created: number
  hidden: boolean
  locked: boolean
  versions: FileVersion[]
  tags: string[]

  constructor ({
    file,
    created = Date.now(),
    hidden = false,
    locked = false,
    versions = [],
    tags = []
  }: {
    file: string
    created?: number
    hidden?: boolean
    locked?: boolean
    versions?: FileVersion[]
    tags?: string[]
  }) {
    this.file = file
    this.created = created
    this.hidden = hidden
    this.locked = locked
    this.versions = versions
    this.tags = tags
  }
}

class FileVersion {
  size: number
  location: string
  hash: string
  modified: number

  constructor ({
    size,
    location,
    hash,
    modified = Date.now()
  }: {
    size: number
    location: string
    hash: string
    modified?: number
  }) {
    this.size = size
    this.location = location
    this.hash = hash
    this.modified = modified
  }
}

/**
 * a metadata class to describe where a folder can be found (for root metadata of an account)
 */
class FolderEntryMeta {
  /** a name of the folder shown in the UI */
  name: string
  /**
   * the public key for the metadata file
   * it is how the file will be queried for (using the same system as for the account metadata)
   */
  location: string

  /**
   * create metadata entry for a folder
   *
   * @param name - a name of the folder shown in the UI
   * @param location - the public key for the metadata file
   *   it is how the file will be queried for (using the same system as for the account metadata)
   */
  constructor ({
    name,
    location
  }: {
    name: string
    location: string
  }) {
    this.name = name
    this.location = location
  }
}

/**
 * a metadata class to describe a folder for the UI
 */
class FolderMeta {
  /** a nickname shown on the folder when accessed without adding to account metadata */
  name: string
  /** the files included only in the most shallow part of the folder */
  files: FileEntryMeta[]
  /** when the directory was created (if not created now) */
  created: number
  /** if the folder should be hidden (this could also be automatically generated within the UI) */
  hidden: boolean
  /**
   * if the folder's metadata is encrypted
   * (will require password in the UI, may need bytes prefixed to meta to determine whether it was encrypted)
   */
  locked: boolean
  /** tags assigned to the folder for organization/searching */
  tags: string[]

  /**
   * create metadata for a folder
   *
   * @param name - a nickname shown on the folder when accessed without adding to account metadata
   * @param files - the files included only in the most shallow part of the folder
   * @param created - when the directory was created (if not created now)
   * @param hidden - if the folder should be hidden (this could also be automatically generated within the UI)
   * @param locked - if the folder's metadata is encrypted (will require password in the UI)
   *  NOTE: may need bytes prefixed to meta to determine whether it was encrypted
   * @param tags - tags assigned to the folder for organization/searching
   */
  constructor ({
    name,
    files = [],
    created = Date.now(),
    hidden = false,
    locked = false,
    tags = []
  }: {
    name: string
    files?: FileEntryMeta[]
    created: number
    hidden?: boolean
    locked?: boolean
    tags?: string[]
  }) {
    this.name = name
    this.files = files
    this.created = created
    this.hidden = hidden
    this.locked = locked
    this.tags = tags
  }
}

export {
  AccountMeta,
  AccountPreferences,
  FileEntryMeta,
  FileVersion,
  FolderEntryMeta,
  FolderMeta
}
