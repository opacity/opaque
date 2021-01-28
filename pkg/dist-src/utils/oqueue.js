import { Mutex } from "async-mutex";
import { extractPromise } from "./extractPromise";
export class OQ {
    constructor(concurrency = 1, tolerance = concurrency) {
        this._e = new EventTarget();
        // n is the serving finished index
        this._n = -1;
        // o is the checkout finished index
        this._o = -1;
        // u is the unfinished work count
        this._u = 0;
        // c is the current concurrency
        this._c = 0;
        this._isClosed = false;
        this._queue = [];
        this._m = new Mutex();
        this._cl = concurrency;
        this._ct = tolerance;
        const [closed, resolveClosed] = extractPromise();
        this._closed = closed;
        this._resolveClosed = resolveClosed;
        // console.log(this._m)
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
        const l = (c) => {
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
        const l = (c) => {
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
        const l = (c) => {
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
        this._e.dispatchEvent(new ProgressEvent("now-serving", { loaded: n }));
        const w = wfn(n);
        Promise.resolve(w).then(async () => {
            this._n++;
            this._c--;
            this._e.dispatchEvent(new ProgressEvent("work-finished", { loaded: n }));
            const release = await this._m.acquire();
            if (this._c < this._cl && this._queue[0]) {
                this._queue[0][1]();
            }
            this._queue.shift();
            release();
        });
        // wait for previous checkout
        await this.waitForCommit(n - 1);
        if (this._isClosed) {
            return;
        }
        // console.log("checkout: " + n)
        const v = await cfn(await Promise.resolve(w), n);
        release = await this._m.acquire();
        this._o++;
        this._e.dispatchEvent(new ProgressEvent("checkout", { loaded: this._o }));
        release();
        return v;
    }
    close() {
        this._isClosed = true;
        this._resolveClosed();
    }
}
