import { FileVersion, MinifiedFileVersion, MinifiedFileVersionProps } from "./file-version"

/**
 * metadata to describe a file as it relates to the UI
 *
 * @public
 */
class FileEntryMeta {
	/** the name of the file as shown in the UI */
	name: string
	/** the date in `ms` that this file was initially uploaded */
	created: number
	/** the date in `ms` that the newest version of this file was uploaded */
	modified: number
	/** versions of the uploaded file (the most recent of which should be the current version of the file) */
	versions: FileVersion[]

	/**
	 * create metadata for a file entry in the UI
	 *
	 * @param name - the name of the file as shown in the UI
	 * @param created - the date in `ms` that this file was initially uploaded
	 * @param created - the date in `ms` that the newest version of this file was uploaded
	 * @param versions - versions of the uploaded file (the most recent of which should be the current version of the file)
	 */
	constructor ({
		name,
		created = Date.now(),
		modified = Date.now(),
		versions = []
	}: {
		name: string
		created?: number
		modified?: number
		versions?: FileVersion[]
	}) {
		this.name = name
		this.created = created
		this.modified = modified
		this.versions = versions
	}

	/** @internal */
	minify = () => new MinifiedFileEntryMeta([
		this.name,
		this.created,
		this.modified,
		this.versions.map(version => new FileVersion(version).minify())
	])
}

type MinifiedFileEntryMetaProps = [
	string,
	number,
	number,
	MinifiedFileVersion[]
]

/**
 * @internal
 */
class MinifiedFileEntryMeta extends Array {
	/** the name of the file as shown in the UI */
	0: string
	/** the date in `ms` that this file was initially uploaded */
	1: number
	/** the date in `ms` that the newest version of this file was uploaded */
	2: number
	/** versions of the uploaded file (the most recent of which should be the current version of the file) */
	3: MinifiedFileVersion[]

	constructor ([
		name,
		created,
		modified,
		versions
	]: MinifiedFileEntryMetaProps) {
		super(4)

		this[0] = name
		this[1] = created
		this[2] = modified
		this[3] = versions
	}

	unminify = () => new FileEntryMeta({
		name: this[0],
		created: this[1],
		modified: this[2],
		versions: this[3].map(version => new MinifiedFileVersion(version as unknown as MinifiedFileVersionProps).unminify())
	})
}

export { FileEntryMeta, MinifiedFileEntryMeta, MinifiedFileEntryMetaProps }
