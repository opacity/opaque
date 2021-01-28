export const extractPromise = () => {
    let rs, rj;
    const promise = new Promise((resole, reject) => {
        rs = resole;
        rj = reject;
    });
    return [promise, rs, rj];
};
