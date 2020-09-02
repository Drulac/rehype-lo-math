const visit = require('unist-util-visit')

const unified = require('unified')
const parse = require('rehype-parse')
const toText = require('hast-util-to-text')

const convertFormule = require('./convertFormule.js')

const cacheMaxLength = 50
const cache = []

/*
const CHTML = require('mathjax-full/js/output/chtml.js')
	.CHTML
const mathjax = require('mathjax-full/js/mathjax.js')
	.mathjax
const AsciiMath = require('mathjax-full/js/input/asciimath.js')
	.AsciiMath
const liteAdaptor = require('mathjax-full/js/adaptors/liteAdaptor.js')
	.liteAdaptor
const RegisterHTMLHandler = require('mathjax-full/js/handlers/html.js')
	.RegisterHTMLHandler
*/
//
//  Create DOM adaptor and register it for HTML documents
//
/*
const adaptor = liteAdaptor({ fontSize: 12 })
RegisterHTMLHandler(adaptor)
*/
//
//  Create input and output jax and a document using them on the content from the HTML file
//
/*
const asciimath = new AsciiMath()
const chtml = new CHTML({ scale: 1, minScale: 1 })
const html = mathjax.document('', {
	InputJax: asciimath,
	OutputJax: chtml,
})
*/

//
//  Typeset the math from the command line
//
//

/*
const mathjaxProm = new Promise((resolve, reject) => {
	resolve((str, opts) => {
		const node = html.convert(str || '', {
			display: true,
			em: 12,
			ex: 12,
		})

		//
		//  If the --css option was specified, output the CSS,
		//  Otherwise, typeset the math and output the HTML
		//
		const content =
			`<style>${adaptor
				.textContent(chtml.styleSheet(html))
				.replace(/\n/g, ' ')}</style>` +
			adaptor.outerHTML(node)
		console.log(content)
		return content
	})
})
*/

const mathjaxProm = require('mathjax')
	.init({
		loader: {
			load: ['input/asciimath', 'output/svg'],
		},
		startup: {
			// HACK for setting fixed size for all math
			ready() {
				const MmlMath =
					MathJax._.core.MmlTree.MmlNodes.math.MmlMath
				MmlMath.defaults.scriptminsize = '1em'
				MathJax.startup.defaultReady()
			},
		},
	})
	.catch((err) => console.log(err.message))
	.then((MathJax) => {
		return (str) => {
			//TODO: add cache to avoid repetitive math calculs

			try {
				const svg = MathJax.asciimath2svg(str, {
					display: true,
					em: 12,
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

const source = 'rehype-lo-math'

function toMath(value, mathjax) {
	if (value.split('{').length !== value.split('}').length) {
		return '<p>"not same `{`, `}`count"</p>'
	} else {
		const cacheIndex = cache.findIndex(
			([cachedInput, cachedResult]) => cachedInput === value
		)

		if (cacheIndex !== -1) {
			return cache[cacheIndex][1]
		}

		value = value
			.replace(/&gt;/g, '>')
			.replace(/&lt;/g, '<')
			.replace(/&nbsp;/g, ' ')
			.replace(/\s/g, ' ')
			.replace(/[ ]+\)/g, ')')

		console.error(value, convertFormule(value))

		const result = `<span class="mathjax">${mathjax(
			convertFormule(value)
		)}</span>`

		cache.push([value, result])
		if (cache.length > cacheMaxLength) cache.splice(0, 1) //delete the oldest

		return result
	}
}

function rehypeLoMath(options) {
	const opts = options || {}
	const throwOnError = opts.throwOnError || false

	console.log('imported rhm')

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

			let value = toText(element)
			let result

			try {
				result = toMath(value, mathjax)
			} catch (error) {
				console.error(error)

				const fn = throwOnError ? 'fail' : 'message'
				const origin = [
					source,
					error.name.toLowerCase(),
				].join(':')

				//file[fn](error.message, element.position, origin)

				result = mathjax(value)
			}

			element.children = parseHtml.parse(result).children
		}
	}
}
