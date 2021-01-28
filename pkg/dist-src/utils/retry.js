import { extractPromise } from "./extractPromise";
export class Retry {
    constructor(fn, { firstTimer, nextTimer, maxRetries, handler }) {
        this._handler = () => false;
        this._timer = 5000;
        this._nextTimer = (last) => 2 * last;
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
        }
        catch (err) {
            console.info(err);
            const closed = await this._handler(err);
            if (closed || this._retries++ > this._maxRetries) {
                throw err;
            }
            else {
                console.log("retry");
                const [promise, resolve] = extractPromise();
                setTimeout(resolve, await this._nextTimer(this._timer));
                await promise;
                console.log("ready");
                return this._retry();
            }
        }
    }
}
