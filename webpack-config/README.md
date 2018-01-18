# opentrons webpack config

> Shareable pieces of webpack configuration

## usage

To use in a project, add `@opentrons/webpack-config` as a `devDependency` and run `yarn`.

Then, in your `webpack.config.js`:

``` js
// webpack.config.js
const {rules} = require('@opentrons/webpack-config')

module.exports = {
  // snip...
  rules: [
    rules.js,
    rules.globalCss,
    rules.localCss,
    rules.fonts,
    rules.images
  ],
  // snip...
}
```

### loader rules

[`webpack-config/lib/rules.js`](./lib/rules.js)

 key        | loaders                                    | matches
----------- | ------------------------------------------ | -----------
 js         | babel-loader                               | *.js
 worker     | worker-loader                              | *.worker.js
 globalCss  | css-loader, postcss-loader                 | *.global.css
 localCss   | css-loader (modules: true), postcss-loader | !(global).css
 handlebars | handlebars-loader                          | *.hbs
 fonts      | url-loader                                 | WOFF extensions
 images     | url-loader                                 | Image extensions

**Please note**

The CSS rules will act differently depending on `NODE_ENV` to support hot-module reloading:

-   `development`: prepends `style-loader`
-   anything else: wraps the loaders in `ExtractTextWebpackPlugin`
