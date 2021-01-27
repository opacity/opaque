import { ReadableStream as ReadableStreamPolyfill } from "web-streams-polyfill"

export const polyfillReadableStream = <T> (rs: ReadableStream<T>, strategy?: QueuingStrategy<T>) => {
	const reader = rs.getReader()

	return new ReadableStreamPolyfill<T>({
		async pull (controller) {
			const r = await reader.read()

			if (r.value) {
				// console.log(r.value)

				controller.enqueue(r.value)
			}

			if (r.done) {
				controller.close()
			}
		}
	}, strategy)
}
