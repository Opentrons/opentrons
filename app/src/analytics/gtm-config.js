// google tag manager config for webpack and app
'use strict'

const ID = process.env.NODE_ENV === 'production'
  ? 'GTM-T2569M8'
  : 'GTM-595XX7F'

const DATA_LAYER_NAME = 'dataLayer'

// use commonjs exports for webpack access
module.exports = {ID, DATA_LAYER_NAME}
