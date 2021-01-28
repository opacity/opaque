declare type RetryFunction<T> = () => T | Promise<T>;
declare type RetryNextTimer = (last: number) => number | PromiseLike<number>;
declare type RetryHandler = (err: Error) => boolean | PromiseLike<boolean>;
export declare type RetryOpts = {
    firstTimer?: number;
    nextTimer?: RetryNextTimer;
    maxRetries?: number;
    handler?: RetryHandler;
};
export declare class Retry<T> {
    _fn: RetryFunction<T>;
    _handler: RetryHandler;
    _timer: number;
    _nextTimer: RetryNextTimer;
    _retries: number;
    _maxRetries: number;
    constructor(fn: RetryFunction<T>, { firstTimer, nextTimer, maxRetries, handler }: RetryOpts);
    start(): Promise<T>;
    _retry(): Promise<T>;
}
export {};
