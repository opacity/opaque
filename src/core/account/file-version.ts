/**
 * metadata to describe a version of a file as it relates to a filesystem
 *
 * @public
 */
class FileVersion {
	/** the shareable handle of the file */
	handle: string
	/** the size of the file in bytes */
	size: number
	/** the date in `ms` that this version was uploaded */
	created: number
	/** the date in `ms` that the filesystem marked as last modified */
	modified: number

	/**
	 * create metadata for a file version
	 *
	 * @param handle - the file handle
	 * @param size - the size of the file in bytes
	 * @param created - the date this version was uploaded
	 * @param modified - the date the filesystem marked as last modified
	 */
	constructor ({
		handle,
		size,
		created = Date.now(),
		modified = Date.now()
	}: {
		handle: string
		size: number
		created?: number
		modified?: number
	}) {
		this.handle = handle
		this.size = size
		this.created = created
		this.modified = modified
	}

	/** @internal */
	minify = () => new MinifiedFileVersion([
		this.handle,
		this.size,
		this.created,
		this.modified
	])
}

type MinifiedFileVersionProps = [
	/** the shareable handle of the file */
	string,
	/** the size of the file in bytes */
	number,
	/** the date in `ms` that this version was uploaded */
	number,
	/** the date in `ms` that the filesystem marked as last modified */
	number
]

/**
 * @internal
 */
class MinifiedFileVersion extends Array {
	constructor ([
		handle,
		size,
		created,
		modified
	]: MinifiedFileVersionProps) {
		super(4)

		this[0] = handle
		this[1] = size
		this[2] = created
		this[3] = modified
	}

	unminify = () => new FileVersion({
		handle: this[0],
		size: this[1],
		created: this[2],
		modified: this[3]
	})
}

export { FileVersion, MinifiedFileVersion, MinifiedFileVersionProps }
