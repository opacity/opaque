const hashToPath = (h: string, { prefix = false }: { prefix?: boolean } = {}) => {
	if (h.length % 4) {
		throw new Error("hash length must be multiple of two bytes")
	}

	return (prefix ? "m/" : "") + h.match(/.{1,4}/g).map(p => parseInt(p, 16)).join("'/") + "'"
}

export { hashToPath }
