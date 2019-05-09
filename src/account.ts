import Upload from "./upload"
import Download from "./download"

import HDKey from "hdkey"
import { MasterHandle } from "./core/account"
import { FileEntryMeta, FolderEntryMeta } from "./core/account/metadata"

import { hash } from "./core/hashing"
import { pipe } from "./utils/pipe"

// TODO
const requestGetMetadata = (..._: any): Promise<string> => new Promise(resolve => {
	setTimeout(() => resolve(hash("hello world")), 500)
})

const requestSetMetadata = (..._: any): Promise<null> => new Promise(resolve => {
	setTimeout(resolve, 500)
})

const locationToHandle = (key: HDKey, location: string) => {
	return location + key.privateKey.toString("hex")
}

const downloadMeta = (handle: string): Promise<(FileEntryMeta | FolderEntryMeta)[]> => new Promise(resolve => {
	const download = new Download(handle)

	download.on("finish", data => {
		resolve(JSON.parse(data))
	})
	// TODO
	// download.on("error", async e => {
	// 	if error is network error
	// 		resolve(await downloadMeta(handle))
	// })
})

const uploadMeta = (masterHandle: MasterHandle, meta: (FileEntryMeta | FolderEntryMeta)[]): Promise<any> => new Promise(resolve => {
	const metaFile = new TextEncoder().encode(JSON.stringify(meta))

	const upload = new Upload(metaFile, masterHandle)

	upload.on("finish", resolve)
	// TODO
	// upload.on("error", async e => {
	// 	if error is network error
	// 		resolve(await uploadMeta(handle))
	// })
})

const getAccountFolderMeta = async (masterHandle: MasterHandle, dir: string) => {
	const folderKey: HDKey = pipe(dir)
		.through(
			masterHandle.generateFolderHDKey,
			(hd: HDKey) => hd.publicKey.toString("hex")
		)

	const
		metaLocation = await requestGetMetadata(hash(folderKey.publicKey.toString("hex"))),
		handle = locationToHandle(folderKey, metaLocation),
		meta = await downloadMeta(handle)

	return meta
}

const uploadAccountFolderMeta = async (masterHandle: MasterHandle, dir: string, meta: (FileEntryMeta | FolderEntryMeta)[]) => {
	const
		location = await uploadMeta(masterHandle, meta)

	const folderKey: HDKey = pipe(dir)
		.through(
			masterHandle.generateFolderHDKey,
			(hd: HDKey) => hd.publicKey.toString("hex")
		)

	await requestSetMetadata(folderKey, hash(folderKey.publicKey.toString("hex")), location)
}
