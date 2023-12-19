# opentrons webpack config

> Shareable pieces of webpack configuration

## usage

```js
const { DEV_MODE, baseConfig, rules } = require('@opentrons/webpack-config')
```

### DEV_MODE

[`webpack-config/lib/dev-mode.js`](./lib/dev-mode.js)

If `NODE_ENV === 'development'` then `true`, else `false`

```js
// webpack.config.js
const path = require('path')
const { DEV_MODE } = require('@opentrons/webpack-config')

const JS_ENTRY = path.join(__dirname, 'src/index.js')
const OUTPUT_PATH = path.join(__dirname, 'dist')
const JS_OUTPUT_NAME = 'bundle.js'

const PORT = process.env.PORT
const PUBLIC_PATH = DEV_MODE ? `http://localhost:${PORT}/` : ''

module.exports = {
  // ...snip...
  output: {
    path: OUTPUT_PATH,
    filename: JS_OUTPUT_NAME,
    publicPath: PUBLIC_PATH,
  },
  // ...snip...
}
```

### baseConfig

[`webpack-config/lib/base-config.js`](./lib/base-config.js)

Our base configuration is designed to be used with [webpack-merge][] and includes:

- `target: 'web'`
- `mode` set to `development` or `production` depending on `$NODE_ENV`
- `devtool` set to sane development and production values
- All loader rules in `rules` enabled (see below)
- Plugins:
  - [MiniCssExtractPlugin][] set up for development and production
  - [BundleAnalyzerPlugin][] enabled if `$ANALYZER` is `true`
- Optimization (enabled when `mode === 'production'`):
  - [TerserPlugin][] for JS minification via [terser][]
  - [OptimizeCSSAssetsPlugin][] for CSS minification via [cssnano][]
  - CSS set to output as one file
- `devServer` set with `historyApiFallback: true`

To use in a project, add to your `webpack.config.js`:

```js
// webpack.config.js
const path = require('path')
const merge = require('webpack-merge')
const { baseConfig } = require('@opentrons/webpack-config')

const JS_ENTRY = path.join(__dirname, 'src/index.js')
const OUTPUT_PATH = path.join(__dirname, 'dist')
const JS_OUTPUT_NAME = 'bundle.js'

module.exports = merge(baseConfig, {
  entry: [JS_ENTRY],

  output: {
    path: OUTPUT_PATH,
    filename: JS_OUTPUT_NAME,
  },
})
```

Then you should be ready to roll with production builds and dev server:

- Development server
  - `NODE_ENV=development webpack-dev-server --hot`
- Production build
  - `NODE_ENV=production webpack --profile`
- Analyze production bundles
  - `NODE_ENV=production ANALYZER=true webpack --profile`

[webpack-merge]: https://github.com/survivejs/webpack-merge
[minicssextractplugin]: https://webpack.js.org/plugins/mini-css-extract-plugin/
[bundleanalyzerplugin]: https://github.com/webpack-contrib/webpack-bundle-analyzer
[terserplugin]: https://webpack.js.org/plugins/terser-webpack-plugin/
[optimizecssassetsplugin]: https://github.com/NMFR/optimize-css-assets-webpack-plugin
[terser]: https://github.com/terser-js/terser
[cssnano]: https://cssnano.co/

### rules

[`webpack-config/lib/rules.js`](./lib/rules.js)

If you just need some rules, you can import them directly.

```js
// webpack.config.js
const merge = require('webpack-merge')
const { baseConfig, rules } = require('@opentrons/webpack-config')

module.exports = merge.strategy({ 'module.rules': 'replace' })(baseConfig, {
  module: {
    rules: [rules.js, rules.localCss],
  },
})
```

| key        | loaders                                    | matches             |
| ---------- | ------------------------------------------ | ------------------- |
| js         | babel-loader                               | \*.js               |
| globalCss  | css-loader, postcss-loader                 | \*.global.css       |
| localCss   | css-loader (modules: true), postcss-loader | !(global).css       |
| handlebars | handlebars-loader                          | \*.hbs              |
| fonts      | file-loader                                | TTF/WOFF extensions |
| images     | file-loader                                | Image extensions    |

**Please note**

The CSS rules will act differently depending on `NODE_ENV` to support hot-module reloading:

- `development`: uses `style-loader`
- anything else (e.g. `production`): uses `MiniCssExtractPlugin.loader`
