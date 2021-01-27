const path = require('path');

module.exports = {
	entry: './bundle.ts',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ],
		fallback: {
			// buffer: require.resolve("buffer/"),
			stream: require.resolve("stream-browserify"),
			crypto: require.resolve("crypto-browserify")
		}
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
		libraryTarget: "umd"
	},
};
