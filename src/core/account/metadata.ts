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
    preferences: { [key: string]: AccountPreferences }
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

class FileMeta {
  file: string
  directory: string
  created: number
  hidden: boolean
  locked: boolean
  versions: FileVersion[]
  tags: string[]

  constructor ({
    file,
    directory,
    created = Date.now(),
    hidden = false,
    locked = false,
    versions = [],
    tags = []
  }: {
    file: string,
    directory: string,
    created: number,
    hidden: boolean,
    locked: boolean,
    versions: FileVersion[],
    tags: string[]
  }) {
    this.file = file
    this.directory = directory
    this.created = created
    this.hidden = hidden
    this.locked = locked
    this.versions = versions
    this.tags = tags
  }
}

class FileVersion {
  size: number
  hash: string
  modified: number

  constructor ({
    size,
    hash,
    modified = Date.now()
  }: {
    size: number,
    hash: string,
    modified: number
  }) {
    this.size = size
    this.hash = hash
    this.modified = modified
  }
}

export {
  AccountMeta,
  AccountPreferences,
  FileMeta,
  FileVersion
}
