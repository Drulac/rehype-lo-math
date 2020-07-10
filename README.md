# rehype-lo-math
Transforms math nodes with LibreOffice (writer) math syntax (simplier than AsciiMath)

## install

```sh
npm install --save rehype-lo-math
```

## usage

same as [rehype-katex](https://www.npmjs.com/package/rehype-katex) or [rehype-mathjax](https://www.npmjs.com/package/rehype-mathjax) :

Say we have the following file, `example.html`:

```html
<p>
  Lift(<span class="math math-inline">L</span>) can be determined by Lift Coefficient
  (<span class="math math-inline">C_L</span>) like the following equation.
</p>

<div class="math math-display">
  L = {1} over {2} * rho v^2 S C_L
</div>
```

And our script, `example.js`, looks as follows:

```js
const vfile = require('to-vfile')
const unified = require('unified')
const parse = require('rehype-parse')
const loMath = require('rehype-lo-math')
const stringify = require('rehype-stringify')

unified()
  .use(parse, {fragment: true})
  .use(loMath)
  .use(stringify)
  .process(vfile.readSync('example.html'), function (err, file) {
    if (err) throw err
    console.log(String(file))
  })
```

Now, run `node example` 
