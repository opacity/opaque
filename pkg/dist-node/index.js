'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var asyncMutex = require('async-mutex');
var ponyfill = require('web-streams-polyfill/ponyfill');
var webStreamsPolyfill = require('web-streams-polyfill');
var jsSha3 = require('js-sha3');
var events = require('events');
var web3Utils = require('web3-utils');
var Axios = _interopDefault(require('axios'));
var FormDataNode = _interopDefault(require('form-data'));
var EthUtil = require('ethereumjs-util');
var pathBrowserify = require('path-browserify');
var nodeForge = require('node-forge');
var debounce = _interopDefault(require('debounce'));
var bip39 = require('bip39');
var HDKey = require('hdkey');
var HDKey__default = _interopDefault(HDKey);
var namehash = require('eth-ens-namehash');

const allSettled = async arr => {
  const resolved = [];
  const rejected = [];
  const mutex = new asyncMutex.Mutex();
  arr.forEach(async p => {
    const release = await mutex.acquire();

    try {
      resolved.push((await p));
      rejected.push(null);
    } catch (err) {
      resolved.push(null);
      rejected.push(err);
    } finally {
      release();
    }
  });
  return resolved.reduce((acc, res, i) => {
    acc.push([res, rejected[i]]);
    return acc;
  }, []);
};

const bytesToHex = b => {
  return b.reduce((acc, n) => {
    acc.push(("00" + n.toString(16)).slice(-2));
    return acc;
  }, []).join("");
};
const hexToBytes = h => {
  return new Uint8Array(h.match(/.{1,2}/g).map(b => parseInt(b, 16)));
};

const blockSize = 64 * 1024;
const blockOverhead = 32;
const blockSizeOnFS = blockSize + blockOverhead;
const numberOfBlocks = size => {
  return Math.floor((size - 1) / blockSize) + 1;
};
const numberOfBlocksOnFS = sizeOnFS => {
  return Math.floor((sizeOnFS - 1) / blockSizeOnFS) + 1;
};
const sizeOnFS = size => {
  return size + blockOverhead * numberOfBlocks(size);
};

const serializeEncrypted = async (crypto, bytes, key) => {
  const v = await crypto.decrypt(key, bytes);
  const s = new TextDecoder("utf-8").decode(v);
  return JSON.parse(s);
};

const blocksPerPart = 80;
const partSize = blocksPerPart * blockSize;
const partSizeOnFS = blocksPerPart * blockSizeOnFS;
const numberOfPartsOnFS = size => {
  return Math.floor((sizeOnFS(size) - 1) / partSizeOnFS) + 1;
};

const extractPromise = () => {
  let rs, rj;
  const promise = new Promise((resole, reject) => {
    rs = resole;
    rj = reject;
  });
  return [promise, rs, rj];
};

class OQ {
  constructor(concurrency = 1, tolerance = concurrency) {
    this._e = new EventTarget(); // n is the serving finished index

    this._n = -1; // o is the checkout finished index

    this._o = -1; // u is the unfinished work count

    this._u = 0; // c is the current concurrency

    this._c = 0;
    this._isClosed = false;
    this._queue = [];
    this._m = new asyncMutex.Mutex();
    this._cl = concurrency;
    this._ct = tolerance;
    const [closed, resolveClosed] = extractPromise();
    this._closed = closed;
    this._resolveClosed = resolveClosed; // console.log(this._m)
  }

  get concurrency() {
    return this._c;
  }

  async waitForClose() {
    return await this._closed;
  }

  async waitForLine(size) {
    const [promise, resolve] = extractPromise();

    this._e.addEventListener("now-serving", () => {
      if (this._u - 1 <= size) {
        resolve();
      }
    });

    if (this._u - 1 <= size) {
      resolve();
    }

    return promise;
  }

  async waitForWork(n) {
    // console.log("waiting for service:", n, this._o)
    const [promise, resolve] = extractPromise();
    const name = "now-serving";

    const l = c => {
      if (n == c.loaded) {
        resolve();

        this._e.removeEventListener(name, l);
      }
    };

    this._e.addEventListener(name, l);

    if (n <= this._n) {
      resolve();
    }

    return promise;
  }

  async waitForWorkFinish(n) {
    // console.log("waiting for service:", n, this._o)
    const [promise, resolve] = extractPromise();
    const name = "work-finished";

    const l = c => {
      if (n == c.loaded) {
        resolve();

        this._e.removeEventListener(name, l);
      }
    };

    this._e.addEventListener(name, l);

    if (n <= this._n) {
      resolve();
    }

    return promise;
  }

  async waitForCommit(n) {
    // console.log("waiting for finish:", n, this._o)
    const [promise, resolve] = extractPromise();
    const name = "checkout";

    const l = c => {
      if (n == c.loaded) {
        resolve();

        this._e.removeEventListener(name, l);
      }
    };

    this._e.addEventListener(name, l);

    if (n <= this._o) {
      resolve();
    }

    return promise;
  }

  async add(n, wfn, cfn) {
    if (this._isClosed) {
      return;
    }

    const [workPromise, resolveReadyForWork] = extractPromise();
    let release = await this._m.acquire();

    const i = this._queue.findIndex(([n2]) => n < n2);

    this._queue.splice(i == -1 ? this._queue.length : i, 0, [n, resolveReadyForWork]);

    if (this._c < this._cl && this._queue[0][0] < this._o + 1 + this._ct) {
      this._queue[0][1]();

      this._queue.shift();
    }

    this._u++;
    release();
    await workPromise;

    if (this._isClosed) {
      return;
    }

    this._u--;
    this._c++;

    this._e.dispatchEvent(new ProgressEvent("now-serving", {
      loaded: n
    }));

    const w = wfn(n);
    Promise.resolve(w).then(async () => {
      this._n++;
      this._c--;

      this._e.dispatchEvent(new ProgressEvent("work-finished", {
        loaded: n
      }));

      const release = await this._m.acquire();

      if (this._c < this._cl && this._queue[0]) {
        this._queue[0][1]();
      }

      this._queue.shift();

      release();
    }); // wait for previous checkout

    await this.waitForCommit(n - 1);

    if (this._isClosed) {
      return;
    } // console.log("checkout: " + n)


    const v = await cfn((await Promise.resolve(w)), n);
    release = await this._m.acquire();
    this._o++;

    this._e.dispatchEvent(new ProgressEvent("checkout", {
      loaded: this._o
    }));

    release();
    return v;
  }

  close() {
    this._isClosed = true;

    this._resolveClosed();
  }

}

class Uint8ArrayChunkStream {
  constructor(size, writableStrategy, readableStrategy, hooks) {
    this._l = 0;
    this._hooks = hooks;
    this._size = size;
    this._buffer = new Uint8Array(size);
    const t = this;
    this._transformer = new ponyfill.TransformStream({
      flush(controller) {
        var _a, _b;

        const b = t._buffer.slice(0, t._l);

        (_a = t === null || t === void 0 ? void 0 : t._hooks) === null || _a === void 0 ? void 0 : _a.flush(b);

        if (t._l != 0) {
          (_b = t === null || t === void 0 ? void 0 : t._hooks) === null || _b === void 0 ? void 0 : _b.enqueue(b);
          controller.enqueue(b);
        }

        delete t._buffer;
        delete t._size;
        t._l = 0;
      },

      transform: t._transform.bind(t)
    }, writableStrategy, readableStrategy);
    this.readable = this._transformer.readable;
    this.writable = this._transformer.writable;
  }

  _transform(chunk, controller) {
    var _a, _b;

    (_a = this === null || this === void 0 ? void 0 : this._hooks) === null || _a === void 0 ? void 0 : _a.transform(chunk);
    let written = 0;
    const numberOfChunks = Math.floor((this._l + chunk.length) / this._size);

    for (let bufIndex = 0; bufIndex < numberOfChunks; bufIndex++) {
      const sl = this._l;
      const l = this._size - this._l;

      for (let n = 0; n < this._size - sl; n++) {
        this._buffer[this._l] = chunk[written + n];
        this._l++;
      }

      written += l;
      (_b = this === null || this === void 0 ? void 0 : this._hooks) === null || _b === void 0 ? void 0 : _b.enqueue(this._buffer);
      controller.enqueue(this._buffer);
      this._buffer = new Uint8Array(this._size);
      this._l = 0;
    }

    for (let i = written; i < chunk.length; i++) {
      this._buffer[this._l] = chunk[i];
      this._l++;
    }
  }

}

const polyfillReadableStream = (rs, strategy) => {
  const reader = rs.getReader();
  return new webStreamsPolyfill.ReadableStream({
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

class Download extends EventTarget {
  constructor({
    config,
    handle
  }) {
    super();
    this._cancelled = false;
    this._errored = false;
    this._started = false;
    this._done = false;
    this._paused = false;
    this._unpaused = Promise.resolve();
    this._progress = {
      network: 0,
      decrypt: 0
    };
    this.config = config;
    this._location = handle.slice(0, 32);
    this._key = handle.slice(32);
    const d = this;
    const [finished, resolve, reject] = extractPromise();
    this._finished = finished;

    this._resolve = val => {
      d._done = true;
      resolve(val);
    };

    this._reject = err => {
      d._errored = true;
      reject(err);
    };
  }

  get cancelled() {
    return this._cancelled;
  }

  get errored() {
    return this._errored;
  }

  get started() {
    return this._started;
  }

  get done() {
    return this._done;
  }

  get size() {
    return this._size;
  }

  get sizeOnFS() {
    return this._sizeOnFS;
  }

  get name() {
    var _a;

    return (_a = this._metadata) === null || _a === void 0 ? void 0 : _a.name;
  }

  pause() {
    const [unpaused, unpause] = extractPromise();
    this._unpaused = unpaused;
    this._unpause = unpause;
  }

  unpause() {
    this._unpause();
  }

  async downloadUrl() {
    if (this._downloadUrl) {
      return this._downloadUrl;
    }

    const d = this;
    const downloadUrlRes = await d.config.network.POST(d.config.storageNode + "/api/v1/download", undefined, JSON.stringify({
      fileID: bytesToHex(d._location)
    }), async b => JSON.parse(new TextDecoder("utf8").decode((await new Response(b).arrayBuffer()))).fileDownloadUrl).catch(d._reject);

    if (!downloadUrlRes) {
      return;
    }

    const downloadUrl = downloadUrlRes.data;
    this._downloadUrl = downloadUrl;
    return downloadUrl;
  }

  async metadata() {
    if (this._metadata) {
      return this._metadata;
    }

    const d = this;

    if (!this._downloadUrl) {
      await this.downloadUrl();
    }

    const metadataRes = await d.config.network.GET(this._downloadUrl + "/metadata", undefined, undefined, async b => await serializeEncrypted(d.config.crypto, new Uint8Array((await new Response(b).arrayBuffer())), d._key)).catch(d._reject);

    if (!metadataRes) {
      return;
    } // TODO: migrate to new metadata system


    const metadata = metadataRes.data;
    d._metadata = metadata;
    return metadata;
  }

  async start() {
    if (this._cancelled || this._errored) {
      return;
    }

    if (this._started) {
      return this._output;
    }

    this._started = true;
    this._startTime = Date.now(); // ping both servers before starting

    const arr = await allSettled([this.config.network.GET(this.config.storageNode + "", undefined, undefined, async d => new TextDecoder("utf8").decode((await new Response(d).arrayBuffer())))]).catch(this._reject);

    if (!arr) {
      return;
    }

    for (const v of arr) {
      const [res, rej] = v;

      if (rej) {
        this._reject(rej);

        return;
      }
    }

    const d = this; // Download started metadata
    // ...

    await d.downloadUrl().catch(d._reject);
    await d.metadata().catch(d._reject);
    const downloadUrl = this._downloadUrl;
    const metadata = this._metadata;
    d._size = metadata.size;
    d._sizeOnFS = sizeOnFS(metadata.size);
    d._numberOfBlocks = numberOfBlocks(d._size);
    d._numberOfParts = numberOfPartsOnFS(d._sizeOnFS);
    d.dispatchEvent(new ProgressEvent("start", {
      loaded: numberOfBlocksOnFS(this._sizeOnFS)
    }));
    const netQueue = new OQ(3);
    const decryptQueue = new OQ(blocksPerPart);
    d._netQueue = netQueue;
    d._decryptQueue = decryptQueue;
    let partIndex = 0;
    d._output = new ponyfill.ReadableStream({
      async pull(controller) {
        if (d._cancelled || d._errored) {
          return;
        }

        if (partIndex >= d._numberOfParts) {
          return;
        }

        netQueue.add(partIndex++, async partIndex => {
          if (d._cancelled || d._errored) {
            return;
          }

          await d._unpaused;
          d.dispatchEvent(new ProgressEvent("part-loaded", {
            loaded: partIndex
          }));
          const res = await d.config.network.GET(downloadUrl + "/file", {
            range: `bytes=${partIndex * partSizeOnFS}-${Math.min(d._sizeOnFS, (partIndex + 1) * partSizeOnFS) - 1}`
          }, undefined, async rs => polyfillReadableStream(rs)).catch(d._reject);

          if (!res) {
            return;
          }

          let l = 0;
          res.data.pipeThrough(new ponyfill.TransformStream({
            // log progress
            transform(chunk, controller) {
              for (let i = Math.floor(l / blockSizeOnFS); i < Math.floor((l + chunk.length) / blockSizeOnFS); i++) {
                d.dispatchEvent(new ProgressEvent("block-loaded", {
                  loaded: partIndex * blocksPerPart + i
                }));
              }

              l += chunk.length;
              controller.enqueue(chunk);
            }

          })).pipeThrough(new Uint8ArrayChunkStream(partSizeOnFS)).pipeTo(new ponyfill.WritableStream({
            async write(part) {
              for (let i = 0; i < numberOfBlocksOnFS(part.length); i++) {
                decryptQueue.add(partIndex * blocksPerPart + i, async blockIndex => {
                  if (d._cancelled || d._errored) {
                    return;
                  }

                  let bi = blockIndex % blocksPerPart;
                  await d._unpaused;
                  const block = part.slice(bi * blockSizeOnFS, (bi + 1) * blockSizeOnFS);
                  const decrypted = await d.config.crypto.decrypt(d._key, block).catch(d._reject);

                  if (!decrypted) {
                    return;
                  }

                  return decrypted;
                }, async (decrypted, blockIndex) => {
                  if (!decrypted) {
                    return;
                  }

                  controller.enqueue(decrypted);
                  d.dispatchEvent(new ProgressEvent("download-progress", {
                    loaded: blockIndex,
                    total: d._numberOfBlocks
                  }));
                  d.dispatchEvent(new ProgressEvent("block-finished", {
                    loaded: blockIndex
                  }));
                  d.dispatchEvent(new ProgressEvent("decrypt-progress", {
                    loaded: blockIndex,
                    total: numberOfBlocks(d._size) - 1
                  }));
                });
              }
            }

          }));
          await decryptQueue.waitForCommit(Math.min((partIndex + 1) * blocksPerPart, d._numberOfBlocks) - 1);
          d.dispatchEvent(new ProgressEvent("part-finished", {
            loaded: partIndex
          }));
        }, () => {});
      },

      async start(controller) {
        netQueue.add(d._numberOfParts, () => {}, async () => {
          netQueue.close();
        });
        decryptQueue.add(numberOfBlocks(d._size), () => {}, async () => {
          decryptQueue.close();
        });
        Promise.all([netQueue.waitForClose(), decryptQueue.waitForClose()]).then(() => {
          d._resolve();

          controller.close();
          d._finishTime = Date.now();
          d.dispatchEvent(new ProgressEvent("finish", {
            total: d._finishTime - d._startTime
          }));
        });
      },

      cancel() {
        d._cancelled = true;
      }

    });
    return d._output;
  }

  async finish() {
    return this._finished;
  }

  async cancel() {
    this._cancelled = true;

    if (this._output) {
      this._output.cancel();
    }
  }

}

const getPayload = async ({
  crypto,
  payload: rawPayload,
  key,
  payloadKey = "requestBody"
}) => {
  // rawPayload.timestamp = Date.now();
  const payload = JSON.stringify(rawPayload);
  const hash = new Uint8Array(jsSha3.keccak256.arrayBuffer(payload));
  const signature = await crypto.sign(key, hash);
  const pubKey = await crypto.getPublicKey(key);
  const data = {
    [payloadKey]: payload,
    "signature": bytesToHex(signature),
    "publicKey": bytesToHex(pubKey),
    "hash": bytesToHex(hash)
  };
  return data;
};
const getPayloadFD = async ({
  crypto,
  payload: rawPayload,
  extraPayload,
  key,
  payloadKey = "requestBody"
}) => {
  // rawPayload.timestamp = Date.now();
  const payload = JSON.stringify(rawPayload);
  const hash = new Uint8Array(jsSha3.keccak256.arrayBuffer(payload));
  const signature = await crypto.sign(key, hash);
  const pubKey = await crypto.getPublicKey(key);
  const data = new FormData();
  data.append(payloadKey, payload);
  data.append("signature", bytesToHex(signature));
  data.append("publicKey", bytesToHex(pubKey));
  data.append("hash", bytesToHex(hash));

  if (extraPayload) {
    Object.keys(extraPayload).forEach(key => {
      data.append(key, new Blob([extraPayload[key].buffer]), key);
    });
  }

  return data;
};

class Retry {
  constructor(fn, {
    firstTimer,
    nextTimer,
    maxRetries,
    handler
  }) {
    this._handler = () => false;

    this._timer = 5000;

    this._nextTimer = last => 2 * last;

    this._retries = 0;
    this._maxRetries = 2;
    this._fn = fn;
    this._handler = handler || this._handler;
    this._timer = firstTimer || this._timer;
    this._nextTimer = nextTimer || this._nextTimer;
    this._maxRetries = maxRetries || this._maxRetries;
  }

  start() {
    return this._retry();
  }

  async _retry() {
    try {
      return await this._fn();
    } catch (err) {
      console.info(err);
      const closed = await this._handler(err);

      if (closed || this._retries++ > this._maxRetries) {
        throw err;
      } else {
        console.log("retry");
        const [promise, resolve] = extractPromise();
        setTimeout(resolve, (await this._nextTimer(this._timer)));
        await promise;
        console.log("ready");
        return this._retry();
      }
    }
  }

}

class Upload extends EventTarget {
  constructor({
    config,
    size,
    name,
    type
  }) {
    super();
    this._cancelled = false;
    this._errored = false;
    this._started = false;
    this._done = false;
    this._unpaused = Promise.resolve();
    this._progress = {
      network: 0,
      decrypt: 0
    };
    this._metadata = {
      name: undefined,
      p: undefined,
      size: undefined,
      type: undefined
    };
    this._buffer = [];
    this._dataOffset = 0;
    this._encryped = [];
    this._partOffset = 0;
    this.config = config;
    this._size = size;
    this._sizeOnFS = sizeOnFS(this._size);
    this._numberOfBlocks = numberOfBlocks(this._size);
    this._numberOfParts = numberOfPartsOnFS(this._sizeOnFS);
    this._metadata.name = name;
    this._metadata.size = size;
    this._metadata.type = type;
    const u = this;
    const [finished, resolve, reject] = extractPromise();
    this._finished = finished;

    this._resolve = val => {
      u._done = true;
      resolve(val);
    };

    this._reject = err => {
      u._errored = true;
      u.pause();
      reject(err);
    };
  }

  get cancelled() {
    return this._cancelled;
  }

  get errored() {
    return this._errored;
  }

  get started() {
    return this._started;
  }

  get done() {
    return this._done;
  }

  get size() {
    return this._size;
  }

  get sizeOnFS() {
    return this._sizeOnFS;
  }

  pause() {
    const [unpaused, unpause] = extractPromise();
    this._unpaused = unpaused;
    this._unpause = unpause;
  }

  unpause() {
    this._unpause();
  }

  async generateHandle() {
    if (!this._key) {
      // generate key
      this._key = new Uint8Array((await crypto.subtle.exportKey("raw", (await crypto.subtle.generateKey({
        name: "AES-GCM",
        length: 256
      }, true, ["encrypt", "decrypt"])))));
    }

    if (!this._location) {
      this._location = crypto.getRandomValues(new Uint8Array(32));
    }
  }

  async start() {
    if (this._cancelled || this._errored) {
      return;
    }

    if (this._started) {
      return this._output;
    }

    this._started = true; // ping both servers before starting

    const arr = await allSettled([this.config.network.GET(this.config.storageNode + "", undefined, undefined, async d => new TextDecoder("utf8").decode((await new Response(d).arrayBuffer())))]).catch(this._reject);

    if (!arr) {
      return;
    }

    for (const v of arr) {
      const [res, rej] = v;

      if (rej) {
        this._reject(rej);

        return;
      }
    }

    await this.generateHandle();
    const u = this; // upload started metadata
    // ...

    const encryptedMeta = await u.config.crypto.encrypt(u._key, new TextEncoder().encode(JSON.stringify(u._metadata)));
    const fd = await getPayloadFD({
      crypto: u.config.crypto,
      payload: {
        fileHandle: bytesToHex(u._location),
        fileSizeInByte: u._sizeOnFS,
        endIndex: numberOfPartsOnFS(u._sizeOnFS)
      },
      extraPayload: {
        metadata: encryptedMeta
      }
    });
    await u.config.network.POST(u.config.storageNode + "/api/v1/init-upload", {}, fd).catch(u._reject);
    u.dispatchEvent(new ProgressEvent("start", {
      loaded: numberOfBlocksOnFS(u._sizeOnFS)
    }));
    const encryptQueue = new OQ(1, Number.MAX_SAFE_INTEGER);
    const netQueue = new OQ(3);
    u._encryptQueue = encryptQueue;
    u._netQueue = netQueue;
    let blockIndex = 0;
    let partIndex = 0;
    const partCollector = new Uint8ArrayChunkStream(partSize, new ByteLengthQueuingStrategy({
      highWaterMark: 3 * partSize + 1
    }), new ByteLengthQueuingStrategy({
      highWaterMark: 3 * partSize + 1
    }));
    u._output = new ponyfill.TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      }

    }, new ByteLengthQueuingStrategy({
      highWaterMark: 3 * partSize + 1
    }));

    u._output.readable.pipeThrough(partCollector).pipeTo(new ponyfill.WritableStream({
      async write(part) {
        // console.log("write part")
        u.dispatchEvent(new ProgressEvent("part-loaded", {
          loaded: partIndex
        }));
        const p = new Uint8Array(sizeOnFS(part.length));
        netQueue.add(partIndex++, async partIndex => {
          if (u._cancelled || u._errored) {
            return;
          }

          for (let i = 0; i < numberOfBlocks(part.length); i++) {
            const block = part.slice(i * blockSize, (i + 1) * blockSize);
            encryptQueue.add(blockIndex++, async blockIndex => {
              if (u._cancelled || u._errored) {
                return;
              }

              u.dispatchEvent(new ProgressEvent("block-loaded", {
                loaded: blockIndex
              }));
              return await u.config.crypto.encrypt(u._key, block);
            }, async (encrypted, blockIndex) => {
              // console.log("write encrypted")
              if (!encrypted) {
                return;
              }

              let byteIndex = 0;

              for (let byte of encrypted) {
                p[i * blockSizeOnFS + byteIndex] = byte;
                byteIndex++;
              }

              u.dispatchEvent(new ProgressEvent("upload-progress", {
                loaded: blockIndex,
                total: u._numberOfBlocks
              }));
              u.dispatchEvent(new ProgressEvent("block-finished", {
                loaded: blockIndex
              }));
            });
          }

          await encryptQueue.waitForCommit(blockIndex - 1);
          const res = await new Retry(async () => {
            const fd = await getPayloadFD({
              crypto: u.config.crypto,
              payload: {
                fileHandle: bytesToHex(u._location),
                partIndex: partIndex + 1,
                endIndex: u._numberOfParts
              },
              extraPayload: {
                chunkData: p
              }
            });
            return await u.config.network.POST(u.config.storageNode + "/api/v1/upload", {}, fd);
          }, {
            firstTimer: 500,
            handler: err => {
              console.warn(err);
              return false;
            }
          }).start().catch(u._reject);

          if (!res) {
            return;
          }

          u.dispatchEvent(new ProgressEvent("part-finished", {
            loaded: partIndex
          })); // console.log(res)
          // console.log("finished", blockIndex)

          return p;
        }, async (part, partIndex) => {
          if (!part) {
            return;
          }
        });
      },

      async close() {
        await encryptQueue.waitForClose();
      }

    }));

    (async () => {
      encryptQueue.add(numberOfBlocks(u._size), () => {}, async () => {
        encryptQueue.close();
      });
      netQueue.add(u._numberOfParts, () => {}, async () => {
        const data = await getPayload({
          crypto: u.config.crypto,
          payload: {
            fileHandle: bytesToHex(u._location)
          }
        });
        const res = await u.config.network.POST(u.config.storageNode + "/api/v1/upload-status", {}, JSON.stringify(data)).catch(u._reject); // console.log(res)

        netQueue.close();
      });
      await encryptQueue.waitForClose();
      await netQueue.waitForClose();

      u._resolve();
    })();

    return u._output;
  }

  async finish() {
    return this._finished;
  }

  async cancel() {
    this._cancelled = true; // if (this._output) {
    // 	this._output.cancel()
    // }
  }

}

const readAllIntoUint8Array = async (s, size) => {
  const alloc = new Uint8Array(size);
  const reader = s.getReader();
  let written = 0;

  while (true) {
    let {
      value,
      done
    } = await reader.read();

    if (value) {
      for (let i = 0; i < value.length; i++) {
        alloc[written + i] = value[i];
      }

      written += value.length;
    }

    if (done) {
      break;
    }
  }

  return alloc;
};

const downloadFile = (masterHandle, handle) => {
  const ee = new events.EventEmitter();
  const d = new Download({
    config: {
      crypto: masterHandle.crypto,
      network: masterHandle.net,
      storageNode: masterHandle.downloadOpts.endpoint,
      metadataNode: masterHandle.downloadOpts.endpoint
    },
    handle: hexToBytes(handle)
  });
  d.addEventListener("download-progress", progress => {
    ee.emit("download-progress", {
      progress: progress.loaded / progress.total
    });
  });

  d._finished.catch(err => {
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
    const b = Buffer.from((await readAllIntoUint8Array(stream, d._metadata.size)));
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
    const file = new File([await buf], d._metadata.name, {
      type: d._metadata.type
    });
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

const hash = (...val) => {
  return web3Utils.soliditySha3(...val).replace(/^0x/, "");
};

const hashToPath = (h, {
  prefix = false
} = {}) => {
  if (h.length % 4) {
    throw new Error("hash length must be multiple of two bytes");
  }

  return (prefix ? "m/" : "") + h.match(/.{1,4}/g).map(p => parseInt(p, 16)).join("'/") + "'";
};

const generateSubHDKey = (masterHandle, pathString) => {
  const path = hashToPath(hash(pathString), {
    prefix: true
  });
  return masterHandle.derive(path);
};

/**
 * get a list of available plans
 *
 * @param endpoint
 *
 * @internal
 */

async function getPlans(endpoint) {
  return Axios.get(endpoint + "/plans");
}

/**
 * request the creation of an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKey
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */

async function createAccount(endpoint, hdNode, metadataKey, duration = 12, limit = 128) {
  const payload = {
    metadataKey: metadataKey,
    durationInMonths: duration,
    storageLimit: limit
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/accounts", signedPayload);
}

/**
 * request creating a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */

async function createMetadata(endpoint, hdNode, metadataKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    timestamp,
    metadataKey
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/metadata/create", signedPayload);
}
/**
 * request deleting a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */

async function deleteMetadata(endpoint, hdNode, metadataKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    timestamp,
    metadataKey
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/metadata/delete", signedPayload);
}
/**
 * request changing a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 * @param metadata - the metadata to put
 *
 * @internal
 */

async function setMetadata(endpoint, hdNode, metadataKey, metadata) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    timestamp,
    metadata,
    metadataKey
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/metadata/set", signedPayload);
}
/**
 * request get of a metadata entry
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to access
 * @param metadataKey - the key associated with the metadata
 *
 * @internal
 */

async function getMetadata(endpoint, hdNode, metadataKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    timestamp,
    metadataKey
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/metadata/get", signedPayload);
}

const POLYFILL_FORMDATA = typeof FormData === "undefined";
/**
 * get a signed payload from an hdkey
 *
 * @param rawPayload - a payload object to be processed and signed
 * @param hdNode = the account to sign with
 * @param key
 *
 * @internal
 */

function getPayload$1(rawPayload, hdNode, key = "requestBody") {
  const payload = JSON.stringify(rawPayload);
  const hash = EthUtil.keccak256(payload);
  const signature = hdNode.sign(hash).toString("hex");
  const pubKey = hdNode.publicKey.toString("hex");
  const signedPayload = {
    signature,
    publicKey: pubKey,
    hash: hash.toString("hex")
  };
  signedPayload[key] = payload;
  return signedPayload;
}
/**
 * get a signed formdata payload from an hdkey
 *
 * @param rawPayload - a payload object to be processed and signed
 * @param extraPayload - additional (unsigned) payload information
 * @param hdNode - the account to sign with
 * @param key
 *
 * @internal
 */

function getPayloadFD$1(rawPayload, extraPayload, hdNode, key = "requestBody") {
  // rawPayload.timestamp = Date.now();
  const payload = JSON.stringify(rawPayload);
  const hash = EthUtil.keccak256(payload);
  const signature = hdNode.sign(hash).toString("hex");
  const pubKey = hdNode.publicKey.toString("hex"); // node, buffers

  if (POLYFILL_FORMDATA) {
    const data = new FormDataNode();
    data.append(key, payload);
    data.append("signature", signature);
    data.append("publicKey", pubKey); // data.append("hash", hash);

    if (extraPayload) {
      Object.keys(extraPayload).forEach(key => {
        const pl = Buffer.from(extraPayload[key]);
        data.append(key, pl, {
          filename: key,
          contentType: "application/octet-stream",
          knownLength: pl.length
        });
      });
    }

    return data;
  } else {
    const data = new FormData();
    data.append(key, payload);
    data.append("signature", signature);
    data.append("publicKey", pubKey);

    if (extraPayload) {
      Object.keys(extraPayload).forEach(key => {
        data.append(key, new Blob([extraPayload[key].buffer]), key);
      });
    }

    return data;
  }
}

/**
 * check whether a payment has gone through for an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to check
 *
 * @internal
 */

async function checkPaymentStatus(endpoint, hdNode) {
  const payload = {
    timestamp: Math.floor(Date.now() / 1000)
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/account-data", signedPayload);
}

const getAccountInfo = async masterHandle => (await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data.account;

// TODO: don't use polyfill
const posixSep = new RegExp(pathBrowserify.posix.sep + "+", "g");
const posixSepEnd = new RegExp("(.)" + pathBrowserify.posix.sep + "+$"); // NOTE: win32 isn't included in the polyfill

const win32Sep = new RegExp("\\+", "g");

const trimTrailingSep = path => {
  return path.replace(posixSepEnd, "$1");
};

const cleanPath = path => {
  return trimTrailingSep(path.replace(win32Sep, pathBrowserify.posix.sep).replace(posixSep, pathBrowserify.posix.sep));
};

const getFolderHDKey = (masterHandle, dir) => {
  dir = cleanPath(dir);
  return generateSubHDKey(masterHandle, "folder: " + dir);
};

const getFolderLocation = (masterHandle, dir) => {
  dir = cleanPath(dir);
  return hash(masterHandle.getFolderHDKey(dir).publicKey.toString("hex"));
};

const IV_BYTE_LENGTH = 16;
const TAG_BYTE_LENGTH = 16;
const TAG_BIT_LENGTH = TAG_BYTE_LENGTH * 8;
const BLOCK_OVERHEAD = TAG_BYTE_LENGTH + IV_BYTE_LENGTH;

const Forge = {
  cipher: nodeForge.cipher,
  md: nodeForge.md,
  util: nodeForge.util,
  random: nodeForge.random
};
const ByteBuffer = Forge.util.ByteBuffer; // Encryption

function encrypt(key, byteBuffer) {
  const keyBuf = new ByteBuffer(Buffer.from(key, "hex"));
  const iv = Forge.random.getBytesSync(IV_BYTE_LENGTH);
  const cipher = Forge.cipher.createCipher("AES-GCM", keyBuf);
  cipher.start({
    iv,
    tagLength: TAG_BIT_LENGTH
  });
  cipher.update(byteBuffer);
  cipher.finish();
  byteBuffer.clear();
  byteBuffer.putBuffer(cipher.output);
  byteBuffer.putBuffer(cipher.mode.tag);
  byteBuffer.putBytes(iv);
  return byteBuffer;
}
function encryptString(key, string, encoding = "utf8") {
  const buf = Forge.util.createBuffer(string, encoding);
  return encrypt(key, buf);
}

function decrypt(key, byteBuffer) {
  const keyBuf = new ByteBuffer(Buffer.from(key, "hex"));
  keyBuf.read = 0;
  byteBuffer.read = byteBuffer.length() - BLOCK_OVERHEAD;
  const tag = byteBuffer.getBytes(TAG_BYTE_LENGTH);
  const iv = byteBuffer.getBytes(IV_BYTE_LENGTH);
  const decipher = Forge.cipher.createDecipher("AES-GCM", keyBuf);
  byteBuffer.read = 0;
  byteBuffer.truncate(BLOCK_OVERHEAD);
  decipher.start({
    iv,
    // the type definitions are wrong in @types/node-forge
    tag: tag,
    tagLength: TAG_BIT_LENGTH
  });
  decipher.update(byteBuffer);

  if (decipher.finish()) {
    return decipher.output;
  } else {
    return false;
  }
}

const getFolderMeta = async (masterHandle, dir) => {
  dir = cleanPath(dir);
  const folderKey = masterHandle.getFolderHDKey(dir),
        location = masterHandle.getFolderLocation(dir),
        key = hash(folderKey.privateKey.toString("hex")),
        // TODO: verify folder can only be read by the creating account
  response = await getMetadata(masterHandle.uploadOpts.endpoint, masterHandle, // folderKey,
  location);

  try {
    // TODO
    // I have no idea why but the decrypted is correct hex without converting
    const metaString = decrypt(key, new nodeForge.util.ByteBuffer(Buffer.from(response.data.metadata, "hex"))).toString();

    try {
      const meta = JSON.parse(metaString);
      return meta;
    } catch (err) {
      console.error(err);
      console.info("META STRING:", metaString);
      throw new Error("metadata corrupted");
    }
  } catch (err) {
    console.error(err);
    throw new Error("error decrypting meta");
  }
};

const getHandle = masterHandle => {
  return masterHandle.privateKey.toString("hex") + masterHandle.chainCode.toString("hex");
};

const isPaid = async masterHandle => {
  try {
    const accountInfoResponse = await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle);
    return accountInfoResponse.data.paymentStatus == "paid";
  } catch (_unused) {
    return false;
  }
};

const register = async (masterHandle, duration, limit) => {
  if (await masterHandle.isPaid()) {
    return {
      data: {
        invoice: {
          cost: 0,
          ethAddress: "0x0"
        }
      },
      waitForPayment: async () => ({
        data: (await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data
      })
    };
  }

  const createAccountResponse = await createAccount(masterHandle.uploadOpts.endpoint, masterHandle, masterHandle.getFolderLocation("/"), duration, limit);
  return {
    data: createAccountResponse.data,
    waitForPayment: () => new Promise(resolve => {
      const interval = setInterval(async () => {
        // don't perform run if it takes more than 5 seconds for response
        const time = Date.now();

        if ((await masterHandle.isPaid()) && time + 5 * 1000 > Date.now()) {
          clearInterval(interval);
          await masterHandle.login();
          resolve({
            data: (await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle)).data
          });
        }
      }, 10 * 1000);
    })
  };
};

/**
 * internal API v0
 *
 * @internal
 */

const v0 = {
  downloadFile,
  generateSubHDKey,
  getAccountInfo,
  getFolderHDKey,
  getFolderLocation,
  getFolderMeta,
  getHandle,
  isPaid,
  register
};

/**
 * metadata to describe a version of a file as it relates to a filesystem
 *
 * @public
 */
class FileVersion {
  /**
   * create metadata for a file version
   *
   * @param handle - the file handle
   * @param size - the size of the file in bytes
   * @param created - the date this version was uploaded
   * @param modified - the date the filesystem marked as last modified
   */
  constructor({
    handle,
    size,
    created = Date.now(),
    modified = Date.now()
  }) {
    /** @internal */
    this.minify = () => new MinifiedFileVersion([this.handle, this.size, this.created, this.modified]);

    this.handle = handle;
    this.size = size;
    this.created = created;
    this.modified = modified;
  }

}
/**
 * @internal
 */


class MinifiedFileVersion extends Array {
  constructor([handle, size, created, modified]) {
    super(4);

    this.unminify = () => new FileVersion({
      handle: this[0],
      size: this[1],
      created: this[2],
      modified: this[3]
    });

    this[0] = handle;
    this[1] = size;
    this[2] = created;
    this[3] = modified;
  }

}

/**
 * metadata to describe a file as it relates to the UI
 *
 * @public
 */

class FileEntryMeta {
  /**
   * create metadata for a file entry in the UI
   *
   * @param name - the name of the file as shown in the UI
   * @param created - the date in `ms` that this file was initially uploaded
   * @param created - the date in `ms` that the newest version of this file was uploaded
   * @param versions - versions of the uploaded file (the most recent of which should be the current version of the file)
   */
  constructor({
    name,
    created = Date.now(),
    modified = Date.now(),
    versions = []
  }) {
    /** @internal */
    this.minify = () => new MinifiedFileEntryMeta([this.name, this.created, this.modified, this.versions.map(version => new FileVersion(version).minify())]);

    this.name = name;
    this.created = created;
    this.modified = modified;
    this.versions = versions;
  }

}
/**
 * @internal
 */


class MinifiedFileEntryMeta extends Array {
  constructor([name, created, modified, versions]) {
    super(4);

    this.unminify = () => new FileEntryMeta({
      name: this[0],
      created: this[1],
      modified: this[2],
      versions: this[3].map(version => new MinifiedFileVersion(version).unminify())
    });

    this[0] = name;
    this[1] = created;
    this[2] = modified;
    this[3] = versions;
  }

}

/**
 * metadata to describe where a folder can be found (for root metadata of an account)
 *
 * @public
 */
class FolderEntryMeta {
  /**
   * create metadata entry for a folder
   *
   * @param name - a name of the folder shown in the UI
   * @param location - the public key for the metadata file
   *   it is how the file will be queried for (using the same system as for the account metadata)
   */
  constructor({
    name,
    location
  }) {
    /** @internal */
    this.minify = () => new MinifiedFolderEntryMeta([this.name, this.location]);

    this.name = name;
    this.location = location;
  }

}
/**
 * @internal
 */


class MinifiedFolderEntryMeta extends Array {
  constructor([name, location]) {
    super(2);

    this.unminify = () => new FolderEntryMeta({
      name: this[0],
      location: this[1]
    });

    this[0] = name;
    this[1] = location;
  }

}

/**
 * metadata to describe a folder for the UI
 *
 * @public
 */

class FolderMeta {
  /**
   * create metadata for a folder
   *
   * @param name - a nickname shown on the folder when accessed without adding to account metadata
   * @param files - the files included only in the most shallow part of the folder
   * @param created - when the folder was created (if not created now) in `ms`
   * @param created - when the folder was changed (if not modified now) in `ms`
   */
  constructor({
    name = "Folder",
    files = [],
    folders = [],
    created = Date.now(),
    modified = Date.now()
  } = {}) {
    /** @internal */
    this.minify = () => new MinifiedFolderMeta([this.name, this.files.map(file => new FileEntryMeta(file).minify()), this.folders.map(folder => new FolderEntryMeta(folder).minify()), this.created, this.modified]);

    this.name = name;
    this.files = files;
    this.folders = folders;
    this.created = created;
    this.modified = modified;
  }

}
/**
 * @internal
 */


class MinifiedFolderMeta extends Array {
  constructor([name, files, folders, created, modified]) {
    super(5);

    this.unminify = () => new FolderMeta({
      name: this[0],
      files: this[1].map(file => new MinifiedFileEntryMeta(file).unminify()),
      folders: this[2].map(folder => new MinifiedFolderEntryMeta(folder).unminify()),
      created: this[3],
      modified: this[4]
    });

    this[0] = name;
    this[1] = files;
    this[2] = folders;
    this[3] = created;
    this[4] = modified;
  }

}

class NetQueue extends events.EventEmitter {
  constructor({
    fetch,
    update,
    data = {},
    timeout = 1000
  }) {
    super();
    this.updating = false;
    this.queue = [];
    this.types = {};
    this.data = {};
    this._timeout = 1000;

    this.push = ({
      type,
      payload
    }) => {
      this.queue.push({
        type,
        payload
      });

      this._process();
    };

    this.addType = ({
      type,
      handler
    }) => {
      this.types[type] = handler;
    };

    this._process = debounce(async () => {
      if (this.updating) return;
      this.updating = true;
      const queueCopy = Object.assign([], this.queue);
      this.result = await Promise.resolve(this._fetch());

      for (let {
        type,
        payload
      } of queueCopy) {
        if (this.types[type]) this.result = await Promise.resolve(this.types[type](this.result, payload));else throw new Error("unknown type: " + type);
        this.queue.shift();
      }

      await Promise.resolve(this._update(this.result));
      this.updating = false;
      this.emit("update", this.result);
      if (this.queue.length) this._process();
    }, this._timeout);
    this._fetch = fetch;
    this._update = update;
    this.data = data;
    this._timeout = timeout;
  }

}

const setFolderMeta = async (masterHandle, dir, folderMeta) => {
  dir = cleanPath(dir);
  const folderKey = masterHandle.getFolderHDKey(dir),
        key = hash(folderKey.privateKey.toString("hex")),
        metaString = JSON.stringify(folderMeta.minify()),
        encryptedMeta = Buffer.from(encryptString(key, metaString, "utf8").toHex(), "hex").toString("base64"); // TODO: verify folder can only be changed by the creating account

  await setMetadata(masterHandle.uploadOpts.endpoint, masterHandle, // masterHandle.getFolderHDKey(dir),
  masterHandle.getFolderLocation(dir), encryptedMeta);
};

const removeFile = async (metaQueue, meta, file) => {
  // precondition for if file is no longer in the metadata
  if (!meta.files.find(f => file === f || file.name === f.name)) return meta;
  meta.files = meta.files.filter(f => file !== f && file.name !== f.name);
  return meta;
};

const removeVersion = async (metaQueue, meta, version) => {
  const file = meta.files.find(f => f.versions.includes(version) || !!f.versions.find(v => version.handle === v.handle)); // precondition for if version no longer exists in meta

  if (!file) return meta;
  file.versions = file.versions.filter(v => version !== v && version.handle !== v.handle);
  if (file.versions.length === 0) metaQueue.push({
    type: "remove-file",
    payload: file
  });
  return meta;
};

const addFile = (metaQueue, meta, file) => {
  const existingFile = meta.files.find(f => file === f || file.name === f.name);

  if (existingFile) {
    existingFile.modified = file.modified;
    existingFile.versions = [...existingFile.versions, ...file.versions];
  } else {
    meta.files.push(file);
  }

  return meta;
};

const addFolder = (metaQueue, meta, folder) => {
  const existingFolder = meta.folders.find(f => folder === f || folder.name === f.name);
  if (!existingFolder) meta.folders.push(folder);
  return meta;
};

const removeFolder = async (metaQueue, meta, folder) => {
  // precondition for if folder is no longer in the metadata
  if (!meta.folders.find(f => folder === f || folder.name === f.name)) return meta;
  meta.folders = meta.folders.filter(f => folder !== f && folder.name !== f.name);
  return meta;
};

const createMetaQueue = (masterHandle, dir) => {
  dir = cleanPath(dir);
  if (masterHandle.metaQueue[dir]) return;
  const metaQueue = new NetQueue({
    fetch: async () => {
      return getFolderMeta$1(masterHandle, dir);
    },
    update: async meta => {
      await setFolderMeta(masterHandle, dir, meta);
    }
  });
  const types = [{
    type: "add-folder",
    action: addFolder
  }, {
    type: "add-file",
    action: addFile
  }, {
    type: "remove-folder",
    action: removeFolder
  }, {
    type: "remove-file",
    action: removeFile
  }, {
    type: "remove-version",
    action: removeVersion
  }];

  for (let type of types) {
    metaQueue.addType({
      type: type.type,
      handler: async (meta, payload) => {
        return await type.action(metaQueue, meta, payload);
      }
    });
  }

  masterHandle.metaQueue[dir] = metaQueue;
};

const getFolderMeta$1 = async (masterHandle, dir) => {
  dir = cleanPath(dir);
  createMetaQueue(masterHandle, dir);
  const folderKey = masterHandle.getFolderHDKey(dir),
        location = masterHandle.getFolderLocation(dir),
        key = hash(folderKey.privateKey.toString("hex")),
        // TODO: verify folder can only be read by the creating account
  response = await getMetadata(masterHandle.uploadOpts.endpoint, masterHandle, // folderKey,
  location);

  try {
    const metaString = decrypt(key, new nodeForge.util.ByteBuffer(Buffer.from(response.data.metadata, "base64"))).toString();

    try {
      const meta = JSON.parse(metaString);
      return new MinifiedFolderMeta(meta).unminify();
    } catch (err) {
      console.error(err);
      console.info("META STRING:", metaString);
      throw new Error("metadata corrupted");
    }
  } catch (err) {
    console.error(err);
    throw new Error("error decrypting meta");
  }
};

const buildFullTree = async (masterHandle, dir = "/") => {
  dir = cleanPath(dir);
  const tree = {};
  tree[dir] = await getFolderMeta$1(masterHandle, dir);
  await Promise.all(tree[dir].folders.map(async folder => {
    Object.assign(tree, (await buildFullTree(masterHandle, pathBrowserify.posix.join(dir, folder.name))));
  }));
  return tree;
};

const createFolderFn = async (masterHandle, dir, name) => {
  const fullDir = pathBrowserify.posix.join(dir, name);
  if (name.indexOf("/") > 0 || name.length > 2 ** 8) throw new Error("Invalid folder name"); // recurively create containing folders first

  if (!(await masterHandle.getFolderMeta(dir).catch(console.warn))) await createFolder(masterHandle, pathBrowserify.posix.dirname(dir), pathBrowserify.posix.basename(dir));
  if (await masterHandle.getFolderMeta(fullDir).catch(console.warn)) throw new Error("Folder already exists"); // initialize as empty folder

  await masterHandle.createFolderMeta(fullDir).catch(console.warn);
  await masterHandle.setFolderMeta(fullDir, new FolderMeta({
    name
  }));
  createMetaQueue(masterHandle, dir);
  masterHandle.metaQueue[dir].push({
    type: "add-folder",
    payload: new FolderEntryMeta({
      name,
      location: masterHandle.getFolderLocation(fullDir)
    })
  });
};

const createFolder = async (masterHandle, dir, name) => {
  dir = cleanPath(dir);
  const fullDir = pathBrowserify.posix.join(dir, name);

  if (masterHandle.metaFolderCreating[fullDir]) {
    // TODO: this is hacky
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (!masterHandle.metaFolderCreating[fullDir]) {
          resolve();
          clearInterval(interval);
        }
      }, 250);
    });
    return;
  }

  masterHandle.metaFolderCreating[fullDir] = true;
  await createFolderFn(masterHandle, dir, name);
  masterHandle.metaFolderCreating[fullDir] = false;
};

const createFolderMeta = async (masterHandle, dir) => {
  dir = cleanPath(dir);

  try {
    // TODO: verify folder can only be changed by the creating account
    await createMetadata(masterHandle.uploadOpts.endpoint, masterHandle, // masterHandle.getFolderHDKey(dir),
    masterHandle.getFolderLocation(dir));
  } catch (err) {
    console.error(`Can't create folder metadata for folder ${dir}`);
    throw err;
  }
};

async function deleteFile(endpoint, hdNode, fileID) {
  const payload = {
    fileID
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/delete", signedPayload);
}

const deleteVersion = async (masterHandle, dir, version) => {
  dir = cleanPath(dir);
  await deleteFile(masterHandle.uploadOpts.endpoint, masterHandle, // only send the location, not the private key
  version.handle.slice(0, 64)).catch(err => {
    console.warn("version does not exist");
    console.warn(err);
  });
  createMetaQueue(masterHandle, dir);
  masterHandle.metaQueue[dir].push({
    type: "remove-version",
    payload: version
  });
};

const deleteFile$1 = async (masterHandle, dir, file) => {
  dir = cleanPath(dir);
  const meta = await getFolderMeta$1(masterHandle, dir);
  const existingFile = meta.files.find(f => file === f || file.name === f.name); // precondition for if file is no longer in the metadata

  if (!existingFile) return;

  for (let version of existingFile.versions) {
    await deleteVersion(masterHandle, dir, version);
  }

  createMetaQueue(masterHandle, dir);
  masterHandle.metaQueue[dir].push({
    type: "remove-file",
    payload: existingFile
  });
};

const deleteFolder = async (masterHandle, dir, folder) => {
  dir = cleanPath(dir);
  const fullDir = pathBrowserify.posix.join(dir, folder.name);
  if (folder.name.indexOf("/") > 0 || folder.name.length > 2 ** 8) throw new Error("Invalid folder name");
  const meta = await masterHandle.getFolderMeta(fullDir).catch(console.warn);

  if (meta) {
    await Promise.all([(async () => {
      try {
        for (let folder of meta.folders) {
          await masterHandle.deleteFolder(fullDir, folder);
        }
      } catch (err) {
        console.error("Failed to delete sub folders");
        throw err;
      }
    })(), (async () => {
      try {
        for (let file of meta.files) {
          await masterHandle.deleteFile(fullDir, file);
        }
      } catch (err) {
        console.error("Failed to delete file");
        throw err;
      }
    })()]);
  }

  try {
    await masterHandle.deleteFolderMeta(fullDir);
  } catch (err) {
    console.error("Failed to delete meta entry");
    throw err;
  }

  createMetaQueue(masterHandle, dir);
  masterHandle.metaQueue[dir].push({
    type: "remove-folder",
    payload: folder
  });
};

const deleteFolderMeta = async (masterHandle, dir) => {
  dir = cleanPath(dir); // TODO: verify folder can only be changed by the creating account

  await deleteMetadata(masterHandle.uploadOpts.endpoint, masterHandle, // masterHandle.getFolderHDKey(dir),
  masterHandle.getFolderLocation(dir));
};

const isExpired = async masterHandle => {
  try {
    const accountInfoResponse = await checkPaymentStatus(masterHandle.uploadOpts.endpoint, masterHandle);
    return accountInfoResponse.data.paymentStatus == "expired";
  } catch (_unused) {
    return false;
  }
};

const login = async masterHandle => {
  // only attempt changes if account is paid
  if (!(await isPaid(masterHandle))) {
    return;
  } // try newer meta


  try {
    await masterHandle.getFolderMeta("/");
  } catch (err) {
    // try older meta
    try {
      const meta = await getFolderMeta(masterHandle, "/");
      await masterHandle.deleteFolderMeta("/").catch(console.warn);
      await masterHandle.createFolderMeta("/").catch(console.warn);
      console.info("--- META ---", meta);
      await masterHandle.setFolderMeta("/", new FolderMeta(meta));
    } catch (err) {
      // no meta exists
      // set meta to an empty meta
      console.warn(err);
      await masterHandle.createFolderMeta("/").catch(console.warn);
      await masterHandle.setFolderMeta("/", new FolderMeta());
    }
  }
};

const moveFile = async (masterHandle, dir, {
  file,
  to
}) => {
  dir = cleanPath(dir);
  const meta = await getFolderMeta$1(masterHandle, dir).catch(console.warn),
        toMeta = await getFolderMeta$1(masterHandle, to).catch(console.warn);
  if (!meta) throw new Error("Folder does not exist");
  if (!toMeta) throw new Error("Can't move to folder that doesn't exist");
  const existingFile = meta.files.find(f => file === f || file.name === f.name); // file is no longer in the metadata

  if (!existingFile) throw new Error("File no longer exists");
  createMetaQueue(masterHandle, dir);
  createMetaQueue(masterHandle, to);
  masterHandle.metaQueue[dir].push({
    type: "remove-file",
    payload: existingFile
  });
  masterHandle.metaQueue[to].push({
    type: "add-file",
    payload: existingFile
  });
};

const moveFolder = async (masterHandle, dir, {
  folder,
  to
}) => {
  dir = cleanPath(dir);
  const oldDir = pathBrowserify.posix.join(dir, folder.name),
        newDir = pathBrowserify.posix.join(to, folder.name);
  const folderMeta = await getFolderMeta$1(masterHandle, oldDir).catch(console.warn),
        outerMeta = await getFolderMeta$1(masterHandle, dir).catch(console.warn),
        toMeta = await getFolderMeta$1(masterHandle, to).catch(console.warn);
  if (!folderMeta) throw new Error("Folder does not exist");
  if (!outerMeta) throw new Error("Outer folder does not exist");
  if (!toMeta) throw new Error("Can't move to folder that doesn't exist");
  if (await getFolderMeta$1(masterHandle, newDir).catch(console.warn)) throw new Error("Folder already exists");
  const existingFolder = outerMeta.folders.find(f => folder === f || folder.name === f.name); // folder is no longer in the metadata

  if (!existingFolder) throw new Error("File no longer exists");
  await createFolderMeta(masterHandle, newDir).catch(console.warn);
  await setFolderMeta(masterHandle, newDir, (await getFolderMeta$1(masterHandle, oldDir)));
  await deleteFolderMeta(masterHandle, oldDir);
  createMetaQueue(masterHandle, dir);
  createMetaQueue(masterHandle, to);
  masterHandle.metaQueue[dir].push({
    type: "remove-folder",
    payload: existingFolder
  });
  masterHandle.metaQueue[to].push({
    type: "add-folder",
    payload: existingFolder
  });
};

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(source, true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(source).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

const renameFile = async (masterHandle, dir, {
  file,
  name
}) => {
  dir = cleanPath(dir);
  const meta = await getFolderMeta$1(masterHandle, dir).catch(console.warn);
  if (!meta) throw new Error("Folder does not exist");
  const existingFile = meta.files.find(f => file === f || file.name === f.name); // file is no longer in the metadata

  if (!existingFile) throw new Error("File no longer exists");
  createMetaQueue(masterHandle, dir);
  masterHandle.metaQueue[dir].push({
    type: "remove-file",
    payload: existingFile
  });
  masterHandle.metaQueue[dir].push({
    type: "add-file",
    payload: new FileEntryMeta(_objectSpread2({}, existingFile, {
      name
    }))
  });
};

const renameFolder = async (masterHandle, dir, {
  folder,
  name
}) => {
  dir = cleanPath(dir);
  if (name.indexOf("/") > 0 || name.length > 2 ** 8) throw new Error("Invalid folder name");
  const oldDir = pathBrowserify.posix.join(dir, folder.name),
        newDir = pathBrowserify.posix.join(dir, name);
  const folderMeta = await getFolderMeta$1(masterHandle, dir).catch(console.warn),
        meta = await getFolderMeta$1(masterHandle, dir).catch(console.warn);
  if (!folderMeta) throw new Error("Folder does not exist");
  if (!meta) throw new Error("Outer folder does not exist");
  if (await getFolderMeta$1(masterHandle, newDir).catch(console.warn)) throw new Error("Folder already exists");
  const existingFolder = meta.folders.find(f => folder === f || folder.name === f.name); // folder is no longer in the metadata

  if (!existingFolder) throw new Error("Folder no longer exists");
  await createFolder(masterHandle, dir, name);
  await setFolderMeta(masterHandle, newDir, (await getFolderMeta$1(masterHandle, oldDir)));
  await deleteFolderMeta(masterHandle, oldDir);
  createMetaQueue(masterHandle, dir);
  masterHandle.metaQueue[dir].push({
    type: "remove-folder",
    payload: existingFolder
  });
  masterHandle.metaQueue[dir].push({
    type: "add-folder",
    payload: new FolderEntryMeta({
      name,
      location: getFolderLocation(masterHandle, newDir)
    })
  });
};

/**
 * check the status of renewing an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKeys - all metadata keys from the account to renew
 * @param fileHandles - all file handles from the account to renew
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */

async function renewAccountStatus(endpoint, hdNode, metadataKeys, fileHandles, duration = 12) {
  const payload = {
    metadataKeys,
    fileHandles,
    durationInMonths: duration
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/renew", signedPayload);
}
/**
 * request an invoice for renewing an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */

async function renewAccountInvoice(endpoint, hdNode, duration = 12) {
  const payload = {
    durationInMonths: duration
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/renew/invoice", signedPayload);
}

const renewAccount = async (masterHandle, duration) => {
  const tree = await buildFullTree(masterHandle, "/");
  const metadataKeys = Object.keys(tree).map(dir => getFolderLocation(masterHandle, dir));
  const fileHandles = Object.values(tree).map(folder => folder.files.map(file => file.versions.map(version => version.handle.slice(0, 64)))).flat(2);
  console.log(metadataKeys, fileHandles);
  const renewAccountInvoiceResponse = await renewAccountInvoice(masterHandle.uploadOpts.endpoint, masterHandle, duration);
  console.log(renewAccountInvoiceResponse);
  const renewAccountStatusOpts = [masterHandle.uploadOpts.endpoint, masterHandle, metadataKeys, fileHandles, duration];
  return {
    data: renewAccountInvoiceResponse.data,
    waitForPayment: () => new Promise(resolve => {
      const interval = setInterval(async () => {
        // don't perform run if it takes more than 5 seconds for response
        const time = Date.now();
        const renewAccountStatusResponse = await renewAccountStatus(...renewAccountStatusOpts);
        console.log(renewAccountStatusResponse);

        if (renewAccountStatusResponse.data.status && renewAccountStatusResponse.data.status !== "Incomplete" && time + 5 * 1000 > Date.now()) {
          clearInterval(interval);
          await masterHandle.login();
          resolve({
            data: renewAccountStatusResponse.data
          });
        }
      }, 10 * 1000);
    })
  };
};

/**
 * check the status of upgrading an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param metadataKeys - all metadata keys from the account to upgrade
 * @param fileHandles - all file handles from the account to upgrade
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */

async function upgradeAccountStatus(endpoint, hdNode, metadataKeys, fileHandles, duration = 12, limit = 128) {
  const payload = {
    metadataKeys,
    fileHandles,
    durationInMonths: duration,
    storageLimit: limit
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/upgrade", signedPayload);
}
/**
 * request an invoice for upgrading an account
 *
 * @param endpoint - the base url to send the request to
 * @param hdNode - the account to create
 * @param duration - account duration in months
 * @param limit - storage limit in GB
 *
 * @internal
 */

async function upgradeAccountInvoice(endpoint, hdNode, duration = 12, limit = 128) {
  const payload = {
    durationInMonths: duration,
    storageLimit: limit
  };
  const signedPayload = getPayload$1(payload, hdNode);
  return Axios.post(endpoint + "/api/v1/upgrade/invoice", signedPayload);
}

const upgradeAccount = async (masterHandle, duration, limit) => {
  const tree = await buildFullTree(masterHandle, "/");
  const metadataKeys = Object.keys(tree).map(dir => getFolderLocation(masterHandle, dir));
  const fileHandles = Object.values(tree).map(folder => folder.files.map(file => file.versions.map(version => version.handle.slice(0, 64)))).flat(2);
  console.log(metadataKeys, fileHandles);
  const upgradeAccountInvoiceResponse = await upgradeAccountInvoice(masterHandle.uploadOpts.endpoint, masterHandle, duration, limit);
  console.log(upgradeAccountInvoiceResponse);
  const upgradeAccountStatusOpts = [masterHandle.uploadOpts.endpoint, masterHandle, metadataKeys, fileHandles, duration, limit];
  return {
    data: upgradeAccountInvoiceResponse.data,
    waitForPayment: () => new Promise(resolve => {
      const interval = setInterval(async () => {
        // don't perform run if it takes more than 5 seconds for response
        const time = Date.now();
        const upgradeAccountStatusResponse = await upgradeAccountStatus(...upgradeAccountStatusOpts);
        console.log(upgradeAccountStatusResponse);

        if (upgradeAccountStatusResponse.data.status && upgradeAccountStatusResponse.data.status !== "Incomplete" && time + 5 * 1000 > Date.now()) {
          clearInterval(interval);
          await masterHandle.login();
          resolve({
            data: upgradeAccountStatusResponse.data
          });
        }
      }, 10 * 1000);
    })
  };
};

const uploadFile = async (masterHandle, dir, file) => {
  dir = cleanPath(dir);
  const upload = new Upload({
    config: {
      crypto: masterHandle.crypto,
      network: masterHandle.net,
      storageNode: masterHandle.uploadOpts.endpoint,
      metadataNode: masterHandle.uploadOpts.endpoint
    },
    name: file.name,
    size: file.size,
    type: file.type
  }),
        ee = new events.EventEmitter();
  await upload.generateHandle();
  const handle = bytesToHex(new Uint8Array([...upload._location, ...upload._key]));
  ee.handle = handle;
  upload.addEventListener("upload-progress", progress => {
    ee.emit("upload-progress", {
      progress: progress.loaded / progress.total
    });
  });
  upload.addEventListener("error", err => {
    ee.emit("error", err);
  });
  upload.finish().then(async () => {
    if (!(await getFolderMeta$1(masterHandle, dir).catch(console.warn))) await createFolder(masterHandle, pathBrowserify.posix.dirname(dir), pathBrowserify.posix.basename(dir));
    createMetaQueue(masterHandle, dir);
    masterHandle.metaQueue[dir].push({
      type: "add-file",
      payload: new FileEntryMeta({
        name: file.name,
        modified: file.lastModified,
        versions: [new FileVersion({
          handle,
          size: file.size,
          modified: file.lastModified
        })]
      })
    });
    masterHandle.metaQueue[dir].once("update", meta => {
      ee.emit("finish", {
        handle
      });
    });
  });
  const stream = await upload.start();
  polyfillReadableStream(file.stream()).pipeThrough(stream);
  return ee;
};

/**
 * internal API v1
 *
 * @internal
 */

const v1 = {
  downloadFile,
  generateSubHDKey,
  getAccountInfo,
  getFolderHDKey,
  getFolderLocation,
  getHandle,
  isPaid,
  register,
  buildFullTree,
  createFolder,
  createFolderMeta,
  createMetaQueue,
  deleteFile: deleteFile$1,
  deleteFolder,
  deleteFolderMeta,
  deleteVersion,
  getFolderMeta: getFolderMeta$1,
  isExpired,
  login,
  moveFile,
  moveFolder,
  renameFile,
  renameFolder,
  renewAccount,
  setFolderMeta,
  upgradeAccount,
  uploadFile
};

class WebAccountMiddleware {
  constructor({
    symmetricKey,
    asymmetricKey
  } = {}) {
    this.asymmetricKey = asymmetricKey;
    this.symmetricKey = symmetricKey;
  }

  async getPublicKey(k = this.asymmetricKey) {
    const hd = new HDKey__default();
    hd.privateKey = new Buffer(k.slice(0, 32));
    hd.chainCode = new Buffer(k.slice(32));
    return hd.publicKey;
  }

  async derive(k = this.asymmetricKey, p) {
    const hd = new HDKey__default();
    hd.privateKey = new Buffer(k.slice(0, 32));
    hd.chainCode = new Buffer(k.slice(32));
    const derived = hd.derive(p);
    const k2 = Buffer.concat([derived.privateKey, derived.chainCode]);
    hd.wipePrivateData();
    return k2;
  }

  async sign(k = this.asymmetricKey, d) {
    const hd = new HDKey__default();
    hd.privateKey = new Buffer(k.slice(0, 32));
    hd.chainCode = new Buffer(k.slice(32));
    const sig = hd.sign(new Buffer(d));
    hd.wipePrivateData();
    return sig;
  }

  async encrypt(k = this.symmetricKey, d) {
    const key = await crypto.subtle.importKey("raw", k, "AES-GCM", false, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = new Uint8Array((await crypto.subtle.encrypt({
      name: "AES-GCM",
      iv,
      tagLength: 128
    }, key, d)));
    return new Uint8Array([...encrypted, ...iv]);
  }

  async decrypt(k = this.symmetricKey, ct) {
    const key = await crypto.subtle.importKey("raw", k, "AES-GCM", false, ["decrypt"]);
    return new Uint8Array((await crypto.subtle.decrypt({
      name: "AES-GCM",
      iv: ct.slice(-16)
    }, key, ct.slice(0, -16))));
  }

}

const fetchAdapter = async (method, address, headers, body, mapReturn = async b => await new Response(b).arrayBuffer()) => {
  const res = await fetch(address, {
    method,
    body,
    headers
  });
  return {
    headers: res.headers,
    data: await mapReturn(res.body),
    ok: res.ok,
    redirected: res.redirected,
    status: res.status,
    statusText: res.statusText,
    url: address
  };
};

class WebNetworkMiddleware {
  async GET(address, headers, body, mapReturn) {
    return await fetchAdapter("GET", address, headers, body, mapReturn);
  }

  async POST(address, headers, body, mapReturn) {
    return await fetchAdapter("POST", address, headers, body, mapReturn);
  }

}

/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for representing the account mnemonic
 *
 * @public
 */

class Account {
  /**
   * creates an account from a mnemonic if provided, otherwise from entropy
   *
   * @param mnemonic - the mnemonic to use for the account
   */
  constructor(mnemonic = bip39.generateMnemonic()) {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("mnemonic provided was not valid");
    }

    this._mnemonic = mnemonic;
  }

  get mnemonic() {
    return this._mnemonic.trim().split(/\s+/g);
  }

  get seed() {
    return bip39.mnemonicToSeedSync(this._mnemonic);
  }

}
/**
 * <b><i>this should never be shared or left in storage</i></b><br />
 *
 * a class for creating a master handle from an account mnemonic
 *
 * @remarks
 *
 * a master handle is responsible for:
 *  <br /> - logging in to an account
 *  <br /> - signing changes for the account
 *  <br /> - deterministic entropy for generating features of an account (such as folder keys)
 *
 * @public
 */


class MasterHandle extends HDKey__default {
  /**
   * creates a master handle from an account
   *
   * @param _ - the account to generate the handle from
   * @param _.account - an {@link Account}
   * @param _.handle - an account handle as a string
   */
  constructor({
    account,
    handle
  }, {
    uploadOpts = {},
    downloadOpts = {}
  } = {}) {
    super();
    this.metaQueue = {};
    this.metaFolderCreating = {};
    /**
     * creates a sub key seed for validating
     *
     * @param path - the string to use as a sub path
     */

    this.generateSubHDKey = pathString => generateSubHDKey(this, pathString);

    this.uploadFile = (dir, file) => uploadFile(this, dir, file);

    this.downloadFile = handle => downloadFile(this, handle);
    /**
     * deletes every version of a file and removes it from the metadata
     *
     * @param dir - the containing folder
     * @param file - file entry to delete (loosely matched name)
     */


    this.deleteFile = (dir, file) => deleteFile$1(this, dir, file);
    /**
     * deletes a single version of a file (ie. delete by handle)
     *
     * @param dir - the containing folder
     * @param version - version to delete (loosely matched by handle)
     */


    this.deleteVersion = (dir, version) => deleteVersion(this, dir, version);
    /**
     * creates a dir key seed for validating and folder navigation
     *
     * @param dir - the folder
     */


    this.getFolderHDKey = dir => getFolderHDKey(this, dir);
    /**
     * get the location (ie. metadata id) of a folder
     *
     * @remarks this is a deterministic location derived from the account's hdkey to allow for random folder access
     *
     * @param dir - the folder to locate
     */


    this.getFolderLocation = dir => getFolderLocation(this, dir);
    /**
     * request the creation of a folder metadata
     *
     * @param dir - the folder to create
     */


    this.createFolderMeta = async dir => createFolderMeta(this, dir);
    /**
     * create folder {name} inside of {dir}
     *
     * @param dir - the containing folder
     * @param name - the name of the new folder
     */


    this.createFolder = async (dir, name) => createFolder(this, dir, name);

    this.deleteFolderMeta = async dir => deleteFolderMeta(this, dir);

    this.deleteFolder = async (dir, folder) => deleteFolder(this, dir, folder);

    this.moveFile = async (dir, {
      file,
      to
    }) => moveFile(this, dir, {
      file,
      to
    });

    this.moveFolder = async (dir, {
      folder,
      to
    }) => moveFolder(this, dir, {
      folder,
      to
    });

    this.renameFile = async (dir, {
      file,
      name
    }) => renameFile(this, dir, {
      file,
      name
    });

    this.renameFolder = async (dir, {
      folder,
      name
    }) => renameFolder(this, dir, {
      folder,
      name
    });

    this.setFolderMeta = async (dir, folderMeta) => setFolderMeta(this, dir, folderMeta);

    this.getFolderMeta = async dir => getFolderMeta$1(this, dir);
    /**
     * recursively build full file tree starting from directory {dir}
     *
     * @param dir - the starting directory
     */


    this.buildFullTree = async dir => buildFullTree(this, dir);

    this.getAccountInfo = async () => getAccountInfo(this);

    this.isExpired = async () => isExpired(this);

    this.isPaid = async () => isPaid(this);

    this.login = async () => login(this);

    this.register = async (duration, limit) => register(this, duration, limit);

    this.upgrade = async (duration, limit) => upgradeAccount(this, duration, limit);

    this.renew = async duration => renewAccount(this, duration);

    this.uploadOpts = uploadOpts;
    this.downloadOpts = downloadOpts;

    if (account && account.constructor == Account) {
      const path = "m/43'/60'/1775'/0'/" + hashToPath(namehash.hash("opacity.io").replace(/^0x/, "")); // ethereum/EIPs#1775

      Object.assign(this, HDKey.fromMasterSeed(account.seed).derive(path));
    } else if (handle && handle.constructor == String) {
      this.privateKey = Buffer.from(handle.slice(0, 64), "hex");
      this.chainCode = Buffer.from(handle.slice(64), "hex");
    } else {
      throw new Error("master handle was not of expected type");
    }

    this.crypto = new WebAccountMiddleware({
      asymmetricKey: new Uint8Array([...this.privateKey, ...this.chainCode])
    });
    this.net = new WebNetworkMiddleware();
  }
  /**
   * get the account handle
   */


  get handle() {
    return getHandle(this);
  }

}

exports.HDKey = HDKey__default;
exports.Account = Account;
exports.Download = Download;
exports.FileEntryMeta = FileEntryMeta;
exports.FileVersion = FileVersion;
exports.FolderEntryMeta = FolderEntryMeta;
exports.FolderMeta = FolderMeta;
exports.MasterHandle = MasterHandle;
exports.MinifiedFileEntryMeta = MinifiedFileEntryMeta;
exports.MinifiedFileVersion = MinifiedFileVersion;
exports.MinifiedFolderEntryMeta = MinifiedFolderEntryMeta;
exports.MinifiedFolderMeta = MinifiedFolderMeta;
exports.Upload = Upload;
exports.checkPaymentStatus = checkPaymentStatus;
exports.createAccount = createAccount;
exports.createMetadata = createMetadata;
exports.deleteMetadata = deleteMetadata;
exports.getMetadata = getMetadata;
exports.getPayload = getPayload$1;
exports.getPayloadFD = getPayloadFD$1;
exports.getPlans = getPlans;
exports.setMetadata = setMetadata;
exports.v0 = v0;
exports.v1 = v1;
//# sourceMappingURL=index.js.map
