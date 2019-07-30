import { FileEntryMeta, MinifiedFileEntryMeta, MinifiedFileEntryMetaProps } from "./file-entry"
import { FolderEntryMeta, MinifiedFolderEntryMeta, MinifiedFolderEntryMetaProps } from "./folder-entry"

/**
 * metadata to describe a folder for the UI
 *
 * @public
 */
class FolderMeta {
	/** a nickname shown on the folder when accessed without adding to account metadata */
	name: string
	/** the files included only in the most shallow part of the folder */
	files: FileEntryMeta[]
	/** the folders included only in the most shallow part of the folder */
	folders: FolderEntryMeta[]
	/** when the folder was created (if not created now) in `ms` */
	created: number
	/** when the folder was changed (if not modified now) in `ms` */
	modified: number

	/**
	 * create metadata for a folder
	 *
	 * @param name - a nickname shown on the folder when accessed without adding to account metadata
	 * @param files - the files included only in the most shallow part of the folder
	 * @param created - when the folder was created (if not created now) in `ms`
	 * @param created - when the folder was changed (if not modified now) in `ms`
	 */
	constructor ({
		name = "Folder",
		files = [],
		folders = [],
		created = Date.now(),
		modified = Date.now()
	}: {
		name?: string
		files?: FileEntryMeta[]
		folders?: FolderEntryMeta[]
		created?: number
		modified?: number
	} = {}) {
		this.name = name
		this.files = files
		this.folders = folders
		this.created = created
		this.modified = modified
	}

	/** @internal */
	minify = () => new MinifiedFolderMeta([
		this.name,
		this.files.map(file => new FileEntryMeta(file).minify()),
		this.folders.map(folder => new FolderEntryMeta(folder).minify()),
		this.created,
		this.modified
	])
}

type MinifiedFolderMetaProps = [
	string,
	MinifiedFileEntryMeta[],
	MinifiedFolderEntryMeta[],
	number,
	number
]

/**
 * @internal
 */
class MinifiedFolderMeta extends Array {
	/** a nickname shown on the folder when accessed without adding to account metadata */
	0: string
	/** the files included only in the most shallow part of the folder */
	1: MinifiedFileEntryMeta[]
	/** the folders included only in the most shallow part of the folder */
	2: MinifiedFolderEntryMeta[]
	/** when the folder was created (if not created now) in `ms` */
	3: number
	/** when the folder was changed (if not modified now) in `ms` */
	4: number

	constructor ([
		name,
		files,
		folders,
		created,
		modified
	]: MinifiedFolderMetaProps) {
		super(5)

		this[0] = name
		this[1] = files
		this[2] = folders
		this[3] = created
		this[4] = modified
	}

	unminify = () => new FolderMeta({
		name: this[0],
		files: this[1].map(file => new MinifiedFileEntryMeta(file as MinifiedFileEntryMetaProps).unminify()),
		folders: this[2].map(folder => new MinifiedFolderEntryMeta(folder as MinifiedFolderEntryMetaProps).unminify()),
		created: this[3],
		modified: this[4]
	})
}

export { FolderMeta, MinifiedFolderMeta, MinifiedFolderMetaProps }
