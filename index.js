const visit = require('unist-util-visit')

const unified = require('unified')
const parse = require('rehype-parse')
const toText = require('hast-util-to-text')

const convertFormule = require('./convertFormule.js')
const mathjaxProm = require('mathjax')
	.init({
		loader: { load: ['input/asciimath', 'output/svg'] },
	})
	.catch((err) => console.log(err.message))
	.then((MathJax) => {
		return (str, opts) => {
			//TODO: add cache to avoid repetitive math calculs

			try {
				const svg = MathJax.asciimath2svg(str, {
					display: true,
				})
				return MathJax.startup.adaptor.outerHTML(svg)
			} catch (error) {
				console.error(error)
			}
		}
	})

module.exports = rehypeLoMath

const parseHtml = unified().use(parse, {
	fragment: true,
	position: false,
})

const source = 'rehype-LO-math'

function rehypeLoMath(options) {
	const opts = options || {}
	const throwOnError = opts.throwOnError || false

	return transformMath

	async function transformMath(tree, file) {
		const mathjax = await mathjaxProm

		visit(tree, 'element', onelement)

		function onelement(element) {
			const classes = element.properties.className || []
			const inline = classes.includes('math-inline')
			const displayMode = classes.includes('math-display')

			if (!inline && !displayMode) {
				return
			}

			const value = toText(element)

			let result

			try {
				console.log(value)
				console.log(convertFormule(value))
				result = `<span class="mathjax">${mathjax(
					convertFormule(value)
				)}</span>`

				console.log(result)
			} catch (error) {
				const fn = throwOnError ? 'fail' : 'message'
				const origin = [
					source,
					error.name.toLowerCase(),
				].join(':')

				file[fn](error.message, element.position, origin)

				result = mathjax(value)
			}

			element.children = parseHtml.parse(result).children
		}
	}
}
