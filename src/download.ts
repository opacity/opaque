import { CryptoMiddleware, NetworkMiddleware } from "./middleware"
import { allSettled } from "./utils/allSettled"
import { bytesToHex } from "./utils/hex"
import { sizeOnFS, numberOfBlocks, blockSizeOnFS, numberOfBlocksOnFS } from "./utils/blocks"
import { serializeEncrypted } from "./utils/serializeEncrypted"
import { FileMeta } from "./core/metadata"
import { numberOfPartsOnFS, partSizeOnFS, blocksPerPart } from "./utils/parts"
import { ReadableStream, WritableStream, TransformStream } from "web-streams-polyfill/ponyfill"
import { OQ } from "./utils/oqueue"
import { Uint8ArrayChunkStream } from "./utils/chunkStream"
import { polyfillReadableStream } from "./utils/polyfillStream"
import { extractPromise } from "./utils/extractPromise"

type DownloadConfig = {
	storageNode: string
	metadataNode: string

	crypto: CryptoMiddleware
	network: NetworkMiddleware
}

type DownloadArgs = {
	config: DownloadConfig
	handle: Uint8Array
}

export class Download extends EventTarget {
	config: DownloadConfig

	_location: Uint8Array
	_key: Uint8Array

	_cancelled = false
	_errored = false
	_started = false
	_done = false
	_paused = false

	get cancelled () { return this._cancelled }
	get errored () { return this._errored }
	get started () { return this._started }
	get done () { return this._done }

	_unpaused = Promise.resolve()
	_unpause: (value: void) => void

	_finished: Promise<void>
	_resolve: (value?: void) => void
	_reject: (reason?: any) => void

	_size: number
	_sizeOnFS: number
	_numberOfBlocks: number
	_numberOfParts: number

	get size () { return this._size }
	get sizeOnFS () { return this._sizeOnFS }

	_progress = { network: 0, decrypt: 0 }

	_downloadUrl: string
	_metadata: FileMeta

	_netQueue: OQ<void>
	_decryptQueue: OQ<Uint8Array>

	_output: ReadableStream<Uint8Array>

	get name () { return this._metadata?.name }

	constructor ({ config, handle }: DownloadArgs) {
		super()

		this.config = config

		this._location = handle.slice(0, 32)
		this._key = handle.slice(32)

		const d = this

		const [finished, resolve, reject] = extractPromise()
		this._finished = finished
		this._resolve = (val) => {
			d._done = true

			resolve(val)
		}
		this._reject = (err) => {
			d._errored = true

			reject(err)
		}
	}

	pause () {
		const [unpaused, unpause] = extractPromise()
		this._unpaused = unpaused
		this._unpause = unpause
	}

	unpause () {
		this._unpause()
	}

	async downloadUrl (): Promise<string> {
		if (this._downloadUrl) {
			return this._downloadUrl
		}

		const d = this

		const downloadUrlRes = await d.config.network.POST(
			d.config.storageNode + "/api/v1/download",
			undefined,
			JSON.stringify({ fileID: bytesToHex(d._location) }),
			async (b) => JSON.parse(new TextDecoder("utf8").decode(await new Response(b).arrayBuffer())).fileDownloadUrl
		).catch(d._reject)

		if (!downloadUrlRes) {
			return
		}

		const downloadUrl = downloadUrlRes.data

		this._downloadUrl = downloadUrl

		return downloadUrl
	}

	async metadata (): Promise<FileMeta> {
		if (this._metadata) {
			return this._metadata
		}

		const d = this

		if (!this._downloadUrl) {
			await this.downloadUrl()
		}

		const metadataRes = await d.config.network.GET(
			this._downloadUrl + "/metadata",
			undefined,
			undefined,
			async (b) => await serializeEncrypted<FileMeta>(
				d.config.crypto,
				new Uint8Array(await new Response(b).arrayBuffer()),
				d._key
			)
		).catch(d._reject)

		if (!metadataRes) {
			return
		}

		// TODO: migrate to new metadata system
		const metadata = metadataRes.data

		d._metadata = metadata

		return metadata
	}

	async start (): Promise<ReadableStream<Uint8Array>> {
		if (this._cancelled || this._errored) {
			return
		}

		if (this._started) {
			return this._output
		}

		this._started = true

		// ping both servers before starting
		const arr = await allSettled([
			this.config.network.GET(this.config.storageNode + "", undefined, undefined, async (d) => new TextDecoder("utf8").decode(await new Response(d).arrayBuffer())),
			// this.config.network.GET(this.config.metadataNode + "/ping", "", async (d: Uint8Array) => new TextDecoder("utf8").decode(d)),
		]).catch(this._reject)

		if (!arr) {
			return
		}

		for (const v of arr) {
			const [res, rej] = v

			if (res) {
				// if (res.data != "pong") {
				// 	this.#reject(new Error(`Server ${res.url} did not respond to ping`))
				// 	return
				// }
			}

			if (rej) {
				this._reject(rej)
				return
			}
		}

		const d = this

		// Download started metadata
		// ...

		await d.downloadUrl().catch(d._reject)
		await d.metadata().catch(d._reject)

		const downloadUrl = this._downloadUrl
		const metadata = this._metadata

		d._size = metadata.size
		d._sizeOnFS = sizeOnFS(metadata.size)
		d._numberOfBlocks = numberOfBlocks(d._size)
		d._numberOfParts = numberOfPartsOnFS(d._sizeOnFS)

		d.dispatchEvent(new ProgressEvent("start", { loaded: numberOfBlocksOnFS(this._sizeOnFS) }))

		const netQueue = new OQ<void>(3)
		const decryptQueue = new OQ<Uint8Array>(blocksPerPart)

		d._netQueue = netQueue
		d._decryptQueue = decryptQueue

		let partIndex = 0

		d._output = new ReadableStream<Uint8Array>({
			async pull (controller) {
				if (d._cancelled || d._errored) {
					return
				}

				if (partIndex >= d._numberOfParts) {
					return
				}

				netQueue.add(partIndex++, async (partIndex) => {
					if (d._cancelled || d._errored) {
						return
					}

					await d._unpaused

					d.dispatchEvent(new ProgressEvent("part-loaded", { loaded: partIndex }))

					const res = await d.config.network.GET(
						downloadUrl + "/file",
						{ range: `bytes=${partIndex * partSizeOnFS}-${Math.min(d._sizeOnFS, (partIndex + 1) * partSizeOnFS) - 1}` },
						undefined,
						async (rs) => polyfillReadableStream(rs),
					).catch(d._reject)

					if (!res) {
						return
					}

					let l = 0
					res.data
						.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
							// log progress
							transform (chunk, controller) {
								for (let i = Math.floor(l / blockSizeOnFS); i < Math.floor((l + chunk.length) / blockSizeOnFS); i++) {
									d.dispatchEvent(new ProgressEvent("block-loaded", { loaded: partIndex * blocksPerPart + i }))
								}

								l += chunk.length

								controller.enqueue(chunk)
							},
						}))
						.pipeThrough(new Uint8ArrayChunkStream(partSizeOnFS))
						.pipeTo(new WritableStream<Uint8Array>({
							async write (part) {
								for (let i = 0; i < numberOfBlocksOnFS(part.length); i++) {
									decryptQueue.add(partIndex * blocksPerPart + i, async (blockIndex) => {
										if (d._cancelled || d._errored) {
											return
										}

										let bi = blockIndex % blocksPerPart

										await d._unpaused

										const block = part.slice(bi * blockSizeOnFS, (bi + 1) * blockSizeOnFS)
										const decrypted = await d.config.crypto.decrypt(d._key, block).catch(d._reject)

										if (!decrypted) {
											return
										}

										return decrypted
									}, async (decrypted, blockIndex) => {
										if (!decrypted) {
											return
										}

										controller.enqueue(decrypted)

										d.dispatchEvent(new ProgressEvent("download-progress", { loaded: blockIndex, total: d._numberOfBlocks }))
										d.dispatchEvent(new ProgressEvent("block-finished", { loaded: blockIndex }))
										d.dispatchEvent(new ProgressEvent("decrypt-progress", { loaded: blockIndex, total: numberOfBlocks(d._size) - 1 }))
									})
								}
							}
						}))

					await decryptQueue.waitForCommit(Math.min((partIndex + 1) * blocksPerPart, d._numberOfBlocks) - 1)

					d.dispatchEvent(new ProgressEvent("part-finished", { loaded: partIndex }))
				}, () => {

				})
			},
			async start (controller) {
				netQueue.add(d._numberOfParts, () => {}, async () => {
					netQueue.close()
				})

				decryptQueue.add(numberOfBlocks(d._size), () => {}, async () => {
					decryptQueue.close()
				})

				Promise.all([
					netQueue.waitForClose(),
					decryptQueue.waitForClose(),
				]).then(() => {
					d._resolve()

					controller.close()
				})
			},
			cancel () {
				d._cancelled = true
			}
		})

		return d._output
	}

	async finish () {
		return this._finished
	}

	async cancel () {
		this._cancelled = true

		if (this._output) {
			this._output.cancel()
		}
	}
}
