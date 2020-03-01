import { fileURLToPath } from 'url'
import babel from '@babel/core'

export async function transformSource(source, context, defaultTransformSource) {
	const {code} = await babel.transformAsync(source, {
		babelrc: false,
		configFile: false,
		filename: fileURLToPath(context.url),
		sourceMaps: 'inline',
		plugins: ['babel-plugin-istanbul']
	})

	return {source: code}
}
