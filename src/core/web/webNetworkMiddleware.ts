import { NetworkMiddleware, NetworkMiddlewareResponse, NetworkMiddlewareMapReturn } from "../../middleware"

const fetchAdapter = async <T = Uint8Array>(method: string, address: string, headers: HeadersInit, body: BodyInit, mapReturn: NetworkMiddlewareMapReturn<T> = async (b) => await new Response(b).arrayBuffer() as unknown as T): Promise<NetworkMiddlewareResponse<T>> => {
	const res = await fetch(address, { method, body, headers })

	return {
		headers: res.headers,
		data: await mapReturn(res.body),
		ok: res.ok,
		redirected: res.redirected,
		status: res.status,
		statusText: res.statusText,
		url: address,
	}
}

export class WebNetworkMiddleware implements NetworkMiddleware {
	async GET<T> (address: string, headers?: HeadersInit, body?: undefined, mapReturn?: NetworkMiddlewareMapReturn<T>): Promise<NetworkMiddlewareResponse<T>> {
		return await fetchAdapter("GET", address, headers, body, mapReturn)
	}

	async POST<T> (address: string, headers?: HeadersInit, body?: BodyInit, mapReturn?: NetworkMiddlewareMapReturn<T>) {
		return await fetchAdapter("POST", address, headers, body, mapReturn)
	}
}
