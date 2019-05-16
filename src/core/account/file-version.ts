/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */
class FileVersion {
	/** size in bytes of the file */
	size: number
	/** location on the network of the file */
	// location: string
	//** the shareable handle of the file */
	handle: string
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
	 * @param location - // DEPRECATED location on the network of the file
	 * @param handle - the file handle
	 * @param hash - a hash of the file
	 *   NOTE: probably `sha1`
	 * @param modified - the date in `ms` that this version of the file was originally changed
	 */
	constructor ({
		size,
		// location,
		handle,
		hash,
		modified = Date.now()
	}: {
		size: number
		// location: string
		handle: string
		hash?: string
		modified?: number
	}) {
		this.size = size
		// this.location = location
		this.handle = handle
		this.hash = hash
		this.modified = modified
	}
}

export { FileVersion }
