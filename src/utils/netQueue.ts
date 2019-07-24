import { EventEmitter } from "events"
import debounce from "debounce"

type NetQueueProps<T> = {
	fetch: () => T | Promise<T>
	update: (obj: T) => void
	data?: { [key: string]: any }
	timeout?: number
}

type NetQueueEntry = {
	type: string
	payload: any
}

type NetQueueType<T> = {
	type: string
	handler: (obj: T, payload: any) => T | Promise<T>
}

class NetQueue<T> extends EventEmitter {
	updating = false
	queue: NetQueueEntry[] = []
	types: { [type: string]: (obj: T, payload: any) => T | Promise<T> } = {}

	result: T

	data: { [key: string]: any } = {}

	private _fetch: () => T | Promise<T>
	private _update: (obj: T) => void
	private _timeout: number

	constructor ({ fetch, update, data = {}, timeout = 1000 }: NetQueueProps<T>) {
		super()

		this._fetch = fetch
		this._update = update

		this.data = data

		this._timeout = timeout
	}

	push = ({ type, payload }: NetQueueEntry) => {
		this.queue.push({ type, payload })

		this._process()
	}

	addType = ({ type, handler }: NetQueueType<T>) => {
		this.types[type] = handler
	}

	private _process = debounce(async () => {
		if (this.updating)
			return

		this.updating = true

		const queueCopy = Object.assign([] as NetQueueEntry[], this.queue)

		this.result = await Promise.resolve(this._fetch())

		for (let { type, payload } of queueCopy) {
			if (this.types[type])
				this.result = await Promise.resolve(this.types[type](this.result, payload))
			else
				throw new Error("unknown type: " + type)

			this.queue.shift()
		}

		await Promise.resolve(this._update(this.result))

		this.updating = false

		this.emit("update", this.result)

		if (this.queue.length)
			this._process()
	}, this._timeout)
}

export { NetQueue, NetQueueProps, NetQueueEntry, NetQueueType }
