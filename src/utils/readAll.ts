import { ReadableStream } from "web-streams-polyfill/ponyfill"

export const readAllIntoUint8Array = async (s: ReadableStream<Uint8Array>, size: number) => {
	const alloc = new Uint8Array(size)

	const reader = s.getReader()

	let written = 0

	while (true) {
		let { value, done } = await reader.read()

		if (value) {
			for (let i = 0; i < value.length; i++) {
				alloc[written + i] = value[i]
			}

			written += value.length
		}

		if (done) {
			break
		}
	}

	return alloc
}
