// File transformer for Jest
// Makes asset filenames appear in snapshots
// see https://facebook.github.io/jest/docs/en/webpack.html
const path = require('path')

module.exports = {
  process (src, filename, config, options) {
    return 'module.exports = ' + JSON.stringify(path.basename(filename))
  },
}
