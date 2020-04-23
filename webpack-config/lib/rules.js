// webpack rules by name
'use strict'

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { DEV_MODE } = require('./env')

const CSS_LOADER = {
  loader: 'css-loader',
  options: {
    importLoaders: 1,
  },
}

const CSS_MODULE_LOADER = Object.assign({}, CSS_LOADER, {
  options: Object.assign({}, CSS_LOADER.options, {
    sourceMap: true,
    modules: {
      localIdentName: '[name]__[local]__[hash:base64:5]',
    },
  }),
})

const POSTCSS_LOADER = {
  loader: 'postcss-loader',
  options: {
    ident: 'postcss',
    plugins: loader => [
      require('postcss-import')({ root: loader.resourcePath }),
      require('postcss-apply'),
      require('postcss-color-mod-function'),
      require('postcss-preset-env')({ stage: 0 }),
      require('lost'),
    ],
  },
}

module.exports = {
  // babel loader for JS
  js: {
    test: /\.js$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        cacheDirectory: true,
        rootMode: 'upward',
      },
    },
  },

  // worker loader for inline webworkers
  worker: {
    test: /worker\.js$/,
    exclude: /node_modules/,
    use: {
      loader: 'worker-loader',
      options: {
        inline: true,
        fallback: false,
      },
    },
  },

  // global CSS files
  globalCss: {
    test: /\.global\.css$/,
    use: [
      DEV_MODE ? 'style-loader' : MiniCssExtractPlugin.loader,
      CSS_LOADER,
      POSTCSS_LOADER,
    ],
  },

  // local CSS (CSS module) files
  localCss: {
    test: /^((?!\.global).)*\.css$/,
    use: [
      DEV_MODE ? 'style-loader' : MiniCssExtractPlugin.loader,
      CSS_MODULE_LOADER,
      POSTCSS_LOADER,
    ],
  },

  // handlebars HTML templates
  handlebars: {
    test: /\.hbs$/,
    use: 'handlebars-loader',
  },

  // fonts
  fonts: {
    test: /\.(?:ttf|woff2?(?:\?v=\d+\.\d+\.\d+)?)$/,
    use: {
      loader: 'file-loader',
      options: {
        // [hash] is file-loader specific contenthash
        name: DEV_MODE ? '[path][name].[ext]' : 'fonts/[name].[hash].[ext]',
        // TODO(mc, 2020-02-20): enable esModule option (defaults to true)
        // this will changing any require statements to `require(...).default`
        esModule: false,
      },
    },
  },

  // common image formats
  images: {
    test: /\.(?:ico|gif|png|jpg|jpeg|webp|svg)$/,
    use: {
      loader: 'file-loader',
      options: {
        name: '[name].[hash].[ext]',
        outputPath: 'images',
        // TODO(mc, 2020-02-20): enable esModule option (defaults to true)
        // this will changing any require statements to `require(...).default`
        esModule: false,
      },
    },
  },

  // videos
  videos: {
    test: /\.(?:mp4|webm)$/,
    use: {
      loader: 'file-loader',
      options: {
        name: '[name].[hash].[ext]',
        outputPath: 'videos',
        esModule: false,
      },
    },
  },
}
