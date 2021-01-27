import { ReadableStream, WritableStream, TransformStream } from "web-streams-polyfill/ponyfill"

type Hooks = {
	transform?: (c: Uint8Array) => void
	enqueue?: (c: Uint8Array) => void
	flush?: (c: Uint8Array) => void
}

export class Uint8ArrayChunkStream implements TransformStream<Uint8Array, Uint8Array> {
	_size: number
	_buffer: Uint8Array
	_l = 0

	_hooks: Hooks

	_transformer: TransformStream<Uint8Array, Uint8Array>

	readable: ReadableStream<Uint8Array>
	writable: WritableStream<Uint8Array>

	constructor (
		size: number,
		writableStrategy?: QueuingStrategy<Uint8Array>,
		readableStrategy?: QueuingStrategy<Uint8Array>,
		hooks?: Hooks
	) {
		this._hooks = hooks

		this._size = size
		this._buffer = new Uint8Array(size)

		const t = this

		this._transformer = new TransformStream({
			flush (controller) {
				const b = t._buffer.slice(0, t._l)

				t?._hooks?.flush(b)

				if (t._l != 0) {
					t?._hooks?.enqueue(b)
					controller.enqueue(b)
				}

				delete t._buffer
				delete t._size
				t._l = 0
			},
			transform: t._transform.bind(t),
		}, writableStrategy, readableStrategy)

		this.readable = this._transformer.readable
		this.writable = this._transformer.writable
	}

	_transform (chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
		this?._hooks?.transform(chunk)

		let written = 0

		const numberOfChunks = Math.floor((this._l + chunk.length) / this._size)

		for (let bufIndex = 0; bufIndex < numberOfChunks; bufIndex++) {
			const sl = this._l
			const l = this._size - this._l

			for (let n = 0; n < this._size - sl; n++) {
				this._buffer[this._l] = chunk[written + n]
				this._l++
			}

			written += l

			this?._hooks?.enqueue(this._buffer)
			controller.enqueue(this._buffer)
			this._buffer = new Uint8Array(this._size)
			this._l = 0
		}

		for (let i = written; i < chunk.length; i++) {
			this._buffer[this._l] = chunk[i]
			this._l++
		}
	}
}
