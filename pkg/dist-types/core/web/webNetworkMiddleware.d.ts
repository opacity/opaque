import { NetworkMiddleware, NetworkMiddlewareResponse, NetworkMiddlewareMapReturn } from "../../middleware";
export declare class WebNetworkMiddleware implements NetworkMiddleware {
    GET<T>(address: string, headers?: HeadersInit, body?: undefined, mapReturn?: NetworkMiddlewareMapReturn<T>): Promise<NetworkMiddlewareResponse<T>>;
    POST<T>(address: string, headers?: HeadersInit, body?: BodyInit, mapReturn?: NetworkMiddlewareMapReturn<T>): Promise<NetworkMiddlewareResponse<T>>;
}
