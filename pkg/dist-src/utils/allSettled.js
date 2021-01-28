import { Mutex } from "async-mutex";
export const allSettled = async (arr) => {
    const resolved = [];
    const rejected = [];
    const mutex = new Mutex();
    arr.forEach(async (p) => {
        const release = await mutex.acquire();
        try {
            resolved.push(await p);
            rejected.push(null);
        }
        catch (err) {
            resolved.push(null);
            rejected.push(err);
        }
        finally {
            release();
        }
    });
    return resolved.reduce((acc, res, i) => { acc.push([res, rejected[i]]); return acc; }, []);
};
