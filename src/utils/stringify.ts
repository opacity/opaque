const stringify = (obj) => {
	return JSON.stringify(obj, Object.keys(obj).sort())
}

export { stringify }
