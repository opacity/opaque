import { EventEmitter } from "events";

import { Download } from "../../../../download";
import { MasterHandle } from "../../../../account";

import { hexToBytes } from "../../../../utils/hex";
import { extractPromise } from "../../../../utils/extractPromise";
import { FileMeta } from "../../../metadata";
import { readAllIntoUint8Array } from "../../../../utils/readAll";

// 883befa8647b0c60d25a54939b45fa96b6cf00269cf02a09f66ba49bfdd89c5192fb095aa5c1e0d22bdf0cb17217ea69328120b427d3a36ed4c23c081c1eddeb

type EE = EventEmitter & {
	toBuffer: () => Promise<Buffer>
	toFile: () => Promise<File>
	metadata: () => Promise<FileMeta>
	stream: () => Promise<ReadableStream<Uint8Array>>
}

const downloadFile = (masterHandle: MasterHandle, handle: string): EE => {
	const ee: EE = new EventEmitter() as EE

	const d = new Download(
		{
			config: {
				crypto: masterHandle.crypto,
				network: masterHandle.net,
				storageNode: masterHandle.downloadOpts.endpoint,
				metadataNode: masterHandle.downloadOpts.endpoint,
			},
			handle: hexToBytes(handle),
		}
	);

	d.addEventListener("download-progress", (progress: ProgressEvent) => {
		ee.emit("download-progress", { progress: progress.loaded / progress.total })
	})

	d._finished.catch((err) => {
		ee.emit("error", err)
	})

	let started = false
	let [buf, resolveBuf] = extractPromise<Buffer>()

	const start = async () => {
		if (started) {
			return
		}

		await d.metadata()

		started = true

		const stream = await d.start()
		console.log(stream)
		const b = Buffer.from(await readAllIntoUint8Array(stream, d._metadata.size))

		resolveBuf(b)
		ee.emit("finish")
	}

	const metadata = async (): Promise<FileMeta> => {
		return await d.metadata()
	}

	const toBuffer = async (): Promise<Buffer> => {
		start()

		return await buf
	}

	const toFile = async (): Promise<File> => {
		start()

		const file = new File([await buf], d._metadata.name, { type: d._metadata.type })

		return file
	}

	const stream = async (): Promise<ReadableStream<Uint8Array>> => {
		if (started) {
			return
		}

		started = true

		d.addEventListener("finish", () => {
			ee.emit("finish")
		})

		return d.start()
	}

	ee.metadata = metadata
	ee.toBuffer = toBuffer
	ee.toFile = toFile
	ee.stream = stream

	return ee
}

export { downloadFile }
