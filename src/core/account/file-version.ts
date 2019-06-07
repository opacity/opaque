/**
 * a metadata class to describe a version of a file as it relates to a filesystem
 */
class FileVersion {
	//** the shareable handle of the file */
	handle: string

	/**
	 * create metadata for a file version
	 *
	 * @param handle - the file handle
	 */
	constructor ({
		handle
	}: {
		handle: string
	}) {
		this.handle = handle
	}

	minify () {
		return new MinifiedFileVersion(
			this.handle
		)
	}
}

type MinifiedFileVersionProps = string

class MinifiedFileVersion extends String {
	unminify () {
		return new FileVersion({
			handle: this.toString()
		})
	}
}

export { FileVersion, MinifiedFileVersion, MinifiedFileVersionProps }
