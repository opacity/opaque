import { ReadableStream as ReadableStreamPolyfill } from "web-streams-polyfill";
export const polyfillReadableStream = (rs, strategy) => {
    const reader = rs.getReader();
    return new ReadableStreamPolyfill({
        async pull(controller) {
            const r = await reader.read();
            if (r.value) {
                // console.log(r.value)
                controller.enqueue(r.value);
            }
            if (r.done) {
                controller.close();
            }
        }
    }, strategy);
};
