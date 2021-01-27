export interface CryptoMiddleware {
	getPublicKey (k: Uint8Array): Promise<Uint8Array>

	derive (k: Uint8Array, p: string): Promise<Uint8Array>

	sign (k: Uint8Array, b: Uint8Array): Promise<Uint8Array>

	encrypt (k: Uint8Array, b: Uint8Array): Promise<Uint8Array>
	decrypt (k: Uint8Array, ct: Uint8Array): Promise<Uint8Array>
}

export interface NetworkMiddlewareResponse<T> {
	readonly headers: Headers;
	readonly ok: boolean;
	readonly redirected: boolean;
	readonly status: number;
	readonly statusText: string;
	readonly url: string;

	readonly data: T
}

export type NetworkMiddlewareMapReturn<T> = (body: ReadableStream<Uint8Array>) => Promise<T>

export interface NetworkMiddleware {
	GET<T = Uint8Array> (address: string, headers?: HeadersInit, body?: undefined, mapReturn?: NetworkMiddlewareMapReturn<T>): Promise<NetworkMiddlewareResponse<T>>
	POST<T = Uint8Array> (address: string, headers?: HeadersInit, body?: string | FormData, mapReturn?: NetworkMiddlewareMapReturn<T>): Promise<NetworkMiddlewareResponse<T>>
}
