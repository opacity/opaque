const pipe = (...values) => {
	return {
		through: (fn, ...args) => args.reduce((value, fn) => fn(value), fn(...values))
	}
}

pipe.through = (fn, ...args) => (...values) => {
	return args.reduce((value, fn) => fn(value), fn(...values))
}

export { pipe }
