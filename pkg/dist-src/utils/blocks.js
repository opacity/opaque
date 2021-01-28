export const blockSize = 64 * 1024;
export const blockOverhead = 32;
export const blockSizeOnFS = blockSize + blockOverhead;
export const numberOfBlocks = (size) => {
    return Math.floor((size - 1) / blockSize) + 1;
};
export const numberOfBlocksOnFS = (sizeOnFS) => {
    return Math.floor((sizeOnFS - 1) / blockSizeOnFS) + 1;
};
export const sizeOnFS = (size) => {
    return size + blockOverhead * numberOfBlocks(size);
};
