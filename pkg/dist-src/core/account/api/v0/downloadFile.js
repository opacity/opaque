import { EventEmitter } from "events";
import { Download } from "../../../../download";
import { hexToBytes } from "../../../../utils/hex";
import { extractPromise } from "../../../../utils/extractPromise";
import { readAllIntoUint8Array } from "../../../../utils/readAll";
const downloadFile = (masterHandle, handle) => {
    const ee = new EventEmitter();
    const d = new Download({
        config: {
            crypto: masterHandle.crypto,
            network: masterHandle.net,
            storageNode: masterHandle.downloadOpts.endpoint,
            metadataNode: masterHandle.downloadOpts.endpoint,
        },
        handle: hexToBytes(handle),
    });
    d.addEventListener("download-progress", (progress) => {
        ee.emit("download-progress", { progress: progress.loaded / progress.total });
    });
    d._finished.catch((err) => {
        ee.emit("error", err);
    });
    let started = false;
    let [buf, resolveBuf] = extractPromise();
    const start = async () => {
        if (started) {
            return;
        }
        await d.metadata();
        started = true;
        const stream = await d.start();
        console.log(stream);
        const b = Buffer.from(await readAllIntoUint8Array(stream, d._metadata.size));
        resolveBuf(b);
        ee.emit("finish");
    };
    const metadata = async () => {
        return await d.metadata();
    };
    const toBuffer = async () => {
        start();
        return await buf;
    };
    const toFile = async () => {
        start();
        const file = new File([await buf], d._metadata.name, { type: d._metadata.type });
        return file;
    };
    const stream = async () => {
        if (started) {
            return;
        }
        started = true;
        d.addEventListener("finish", () => {
            ee.emit("finish");
        });
        return d.start();
    };
    ee.metadata = metadata;
    ee.toBuffer = toBuffer;
    ee.toFile = toFile;
    ee.stream = stream;
    return ee;
};
export { downloadFile };
