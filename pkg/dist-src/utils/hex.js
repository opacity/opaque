export const bytesToHex = (b) => {
    return b.reduce((acc, n) => { acc.push(("00" + n.toString(16)).slice(-2)); return acc; }, []).join("");
};
export const hexToBytes = (h) => {
    return new Uint8Array(h.match(/.{1,2}/g).map(b => parseInt(b, 16)));
};
