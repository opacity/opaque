import { CryptoMiddleware, NetworkMiddleware } from "./middleware"
import { FileMeta } from "./core/metadata"
import { OQ } from "./utils/oqueue"
import { allSettled } from "./utils/allSettled"
import { sizeOnFS, numberOfBlocksOnFS, numberOfBlocks, blockSize, blockSizeOnFS } from "./utils/blocks"
import { numberOfPartsOnFS, partSizeOnFS, partSize } from "./utils/parts"
import { getPayloadFD, getPayload } from "./utils/payload"
import { bytesToHex } from "./utils/hex"
import { Uint8ArrayChunkStream } from "./utils/chunkStream"
import { WritableStream, TransformStream } from "web-streams-polyfill/ponyfill"
import { extractPromise } from "./utils/extractPromise"
import { Retry } from "./utils/retry"

type UploadConfig = {
	storageNode: string
	metadataNode: string

	crypto: CryptoMiddleware
	network: NetworkMiddleware
}

type UploadArgs = {
	config: UploadConfig
	size: number
	name: string
	type: string
}

type UploadInitPayload = {
	fileHandle: string
	fileSizeInByte: number
	endIndex: number
}

type UploadInitExtraPayload = {
	metadata: Uint8Array,
}

type UploadPayload = {
	fileHandle: string
	partIndex: number
	endIndex: number
}

type UploadExtraPayload = {
	chunkData: Uint8Array
}

type UploadStatusPayload = {
	fileHandle: string
}

export class Upload extends EventTarget {
	config: UploadConfig

	_location: Uint8Array
	_key: Uint8Array

	_cancelled = false
	_errored = false
	_started = false
	_done = false

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

	_metadata: FileMeta = {
		name: undefined,
		p: undefined,
		size: undefined,
		type: undefined
	}

	_netQueue: OQ<Uint8Array>
	_encryptQueue: OQ<Uint8Array>

	_buffer: number[] = []
	_dataOffset: number = 0
	_encryped: number[] = []
	_partOffset: number = 0

	_output: TransformStream<Uint8Array, Uint8Array>

	pause () {
		const [unpaused, unpause] = extractPromise()
		this._unpaused = unpaused
		this._unpause = unpause
	}

	unpause () {
		this._unpause()
	}

	constructor ({ config, size, name, type }: UploadArgs) {
		super()

		this.config = config

		this._size = size
		this._sizeOnFS = sizeOnFS(this._size)
		this._numberOfBlocks = numberOfBlocks(this._size)
		this._numberOfParts = numberOfPartsOnFS(this._sizeOnFS)

		this._metadata.name = name
		this._metadata.size = size
		this._metadata.type = type

		const u = this

		const [finished, resolve, reject] = extractPromise()
		this._finished = finished
		this._resolve = (val) => {
			u._done = true

			resolve(val)
		}
		this._reject = (err) => {
			u._errored = true

			u.pause()

			reject(err)
		}
	}

	async generateHandle () {
		if (!this._key) {
			// generate key
			this._key = new Uint8Array(await crypto.subtle.exportKey("raw", await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])))
		}

		if (!this._location) {
			this._location = crypto.getRandomValues(new Uint8Array(32))
		}
	}

	async start (): Promise<TransformStream<Uint8Array, Uint8Array>> {
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

		await this.generateHandle()

		const u = this

		// upload started metadata
		// ...

		const encryptedMeta = await u.config.crypto.encrypt(u._key, new TextEncoder().encode(JSON.stringify(u._metadata)))

		const fd = await getPayloadFD<UploadInitPayload, UploadInitExtraPayload>({
			crypto: u.config.crypto,
			payload: {
				fileHandle: bytesToHex(u._location),
				fileSizeInByte: u._sizeOnFS,
				endIndex: numberOfPartsOnFS(u._sizeOnFS),
			},
			extraPayload: {
				metadata: encryptedMeta,
			},
		})

		await u.config.network.POST(u.config.storageNode + "/api/v1/init-upload", {}, fd).catch(u._reject)

		u.dispatchEvent(new ProgressEvent("start", { loaded: numberOfBlocksOnFS(u._sizeOnFS) }))

		const encryptQueue = new OQ<Uint8Array>(1, Number.MAX_SAFE_INTEGER)
		const netQueue = new OQ<Uint8Array>(3)

		u._encryptQueue = encryptQueue
		u._netQueue = netQueue

		let blockIndex = 0
		let partIndex = 0

		const partCollector = new Uint8ArrayChunkStream(
			partSize,
			new ByteLengthQueuingStrategy({ highWaterMark: 3 * partSize + 1 }),
			new ByteLengthQueuingStrategy({ highWaterMark: 3 * partSize + 1 })
		)

		u._output = new TransformStream<Uint8Array, Uint8Array>({
			transform (chunk, controller) {
				controller.enqueue(chunk)
			}
		}, new ByteLengthQueuingStrategy({ highWaterMark: 3 * partSize + 1 }))

		u._output.readable
			.pipeThrough(partCollector)
			.pipeTo(new WritableStream<Uint8Array>({
				async write (part) {
					// console.log("write part")

					u.dispatchEvent(new ProgressEvent("part-loaded", { loaded: partIndex }))

					const p = new Uint8Array(sizeOnFS(part.length))

					netQueue.add(partIndex++, async (partIndex) => {
						if (u._cancelled || u._errored) {
							return
						}

						for (let i = 0; i < numberOfBlocks(part.length); i++) {
							const block = part.slice(i * blockSize, (i + 1) * blockSize)

							encryptQueue.add(blockIndex++, async (blockIndex) => {
								if (u._cancelled || u._errored) {
									return
								}

                u.dispatchEvent(new ProgressEvent("block-loaded", { loaded: blockIndex }))

								return await u.config.crypto.encrypt(u._key, block)
							}, async (encrypted, blockIndex) => {
								// console.log("write encrypted")

								if (!encrypted) {
									return
								}

								let byteIndex = 0
								for (let byte of encrypted) {
									p[i * blockSizeOnFS + byteIndex] = byte
									byteIndex++
								}

                u.dispatchEvent(new ProgressEvent("upload-progress", { loaded: blockIndex, total: u._numberOfBlocks }))

								u.dispatchEvent(new ProgressEvent("block-finished", { loaded: blockIndex }))
							})
						}

						await encryptQueue.waitForCommit(blockIndex - 1)

						const res = await new Retry(async () => {
							const fd = await getPayloadFD<UploadPayload, UploadExtraPayload>({
								crypto: u.config.crypto,
								payload: {
									fileHandle: bytesToHex(u._location),
									partIndex: partIndex + 1,
									endIndex: u._numberOfParts,
								},
								extraPayload: {
									chunkData: p,
								},
							})

							return await u.config.network.POST(u.config.storageNode + "/api/v1/upload", {}, fd)
						}, {
							firstTimer: 500,
							handler: (err) => {
								console.warn(err)

								return false
							}
						}).start().catch(u._reject)

						if (!res) {
							return
						}

						u.dispatchEvent(new ProgressEvent("part-finished", { loaded: partIndex }))

						// console.log(res)

						// console.log("finished", blockIndex)

						return p
					}, async (part, partIndex) => {
						if (!part) {
							return
						}
					})
				},
				async close () {
					await encryptQueue.waitForClose()
				},
			}))

		;(async () => {
			encryptQueue.add(numberOfBlocks(u._size), () => {}, async () => {
				encryptQueue.close()
			})

			netQueue.add(u._numberOfParts, () => {}, async () => {
				const data = await getPayload<UploadStatusPayload>({
					crypto: u.config.crypto,
					payload: {
						fileHandle: bytesToHex(u._location),
					},
				})

				const res = await u.config.network.POST(u.config.storageNode + "/api/v1/upload-status", {}, JSON.stringify(data)).catch(u._reject) as void

				// console.log(res)

				netQueue.close()
			})

			await encryptQueue.waitForClose()
			await netQueue.waitForClose()

			u._resolve()
		})()

		return u._output
	}

	async finish () {
		return this._finished
	}

	async cancel () {
		this._cancelled = true

		// if (this._output) {
		// 	this._output.cancel()
		// }
	}
}
