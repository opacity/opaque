import { Mutex } from "async-mutex";
export declare type OQWorkFn<S> = (n: number) => Promise<S> | S | void;
export declare type OQCommitFn<S, T> = (wret: S | void, n: number) => Promise<T> | T;
export declare class OQ<S, T = void> {
    _e: EventTarget;
    _n: number;
    _o: number;
    _u: number;
    _c: number;
    _cl: number;
    _ct: number;
    _isClosed: boolean;
    _closed: Promise<void>;
    _resolveClosed: () => void;
    _queue: [number, (v?: void) => void][];
    _m: Mutex;
    get concurrency(): number;
    waitForClose(): Promise<void>;
    waitForLine(size: number): Promise<void>;
    waitForWork(n: number): Promise<void>;
    waitForWorkFinish(n: number): Promise<void>;
    waitForCommit(n: number): Promise<void>;
    constructor(concurrency?: number, tolerance?: number);
    add(n: number, wfn: OQWorkFn<S>, cfn: OQCommitFn<S, T>): Promise<T>;
    close(): void;
}
