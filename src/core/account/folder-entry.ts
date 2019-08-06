/**
 * metadata to describe where a folder can be found (for root metadata of an account)
 *
 * @public
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

	/** @internal */
	minify = () => new MinifiedFolderEntryMeta([
		this.name,
		this.location
	])
}

type MinifiedFolderEntryMetaProps = [
	string,
	string
]

/**
 * @internal
 */
class MinifiedFolderEntryMeta extends Array {
	/** a name of the folder shown in the UI */
	0: string
	/**
	 * the public key for the metadata file
	 * it is how the file will be queried for (using the same system as for the account metadata)
	 */
	1: string

	constructor ([
		name,
		location
	]: MinifiedFolderEntryMetaProps) {
		super(2)

		this[0] = name
		this[1] = location
	}

	unminify = () => new FolderEntryMeta({
		name: this[0],
		location: this[1]
	})
}

export { FolderEntryMeta, MinifiedFolderEntryMeta, MinifiedFolderEntryMetaProps }
