const fetchAdapter = async (method, address, headers, body, mapReturn = async (b) => await new Response(b).arrayBuffer()) => {
    const res = await fetch(address, { method, body, headers });
    return {
        headers: res.headers,
        data: await mapReturn(res.body),
        ok: res.ok,
        redirected: res.redirected,
        status: res.status,
        statusText: res.statusText,
        url: address,
    };
};
export class WebNetworkMiddleware {
    async GET(address, headers, body, mapReturn) {
        return await fetchAdapter("GET", address, headers, body, mapReturn);
    }
    async POST(address, headers, body, mapReturn) {
        return await fetchAdapter("POST", address, headers, body, mapReturn);
    }
}
