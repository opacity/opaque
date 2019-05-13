import { FileVersion } from "./file-version"

/**
 * a metadata class to describe a file as it relates to the UI
 */
class FileEntryMeta {
	type = "file"
	/** the name of the file as shown in the UI */
	name: string
	/** the date in `ms` that this file was initially updated */
	created: number
	/** if the file should be hidden (this could also be automatically generated within the UI, ie. `.files`) */
	hidden: boolean
	/**
	 * if the file is encrypted
	 * (will require password in the UI, may need bytes prefixed to meta to determine whether it was encrypted)
	 */
	locked: boolean
	/** versions of the uploaded file (the most recent of which should be the current version of the file) */
	versions: FileVersion[]
	/** tags assigned to the file for organization/searching */
	tags: string[]

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
	constructor ({
		name,
		created = Date.now(),
		hidden = false,
		locked = false,
		versions = [],
		tags = []
	}: {
		name: string
		created?: number
		hidden?: boolean
		locked?: boolean
		versions?: FileVersion[]
		tags?: string[]
	}) {
		this.name = name
		this.created = created
		this.hidden = hidden
		this.locked = locked
		this.versions = versions
		this.tags = tags
	}
}

export { FileEntryMeta }
