// api updater
'use strict'

const fs = require('fs')
const path = require('path')

const updateDirectory = path.join(__dirname, '../../api/dist')

module.exports = function initializeApiUpdate () {
  // TODO(mc, 2018-03-14): proof-of-concept; remove
  fs.readdir(updateDirectory, (error, files) => {
    if (error) return console.error('error reading update dir:', error)
    console.log('api update files:', files)
  })
}
