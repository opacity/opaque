/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */
class FileVersion {
	/** size in bytes of the file */
	size: number
	/** location on the network of the file */
	location: string
	/**
	 * a hash of the file
	 * NOTE: probably `sha1`
	 */
	hash: string
	/** the date in `ms` that this version of the file was originally changed */
	modified: number

	/**
	 * create metadata for a file version
	 *
	 * @param size - size in bytes of the file
	 * @param location - location on the network of the file
	 * @param hash - a hash of the file
	 *   NOTE: probably `sha1`
	 * @param modified - the date in `ms` that this version of the file was originally changed
	 */
	constructor ({
		size,
		location,
		hash,
		modified = Date.now()
	}: {
		size: number
		location: string
		hash?: string
		modified?: number
	}) {
		this.size = size
		this.location = location
		this.hash = hash
		this.modified = modified
	}
}

export { FileVersion }
