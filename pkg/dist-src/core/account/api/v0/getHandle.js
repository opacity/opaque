const getHandle = (masterHandle) => {
    return masterHandle.privateKey.toString("hex") + masterHandle.chainCode.toString("hex");
};
export { getHandle };
