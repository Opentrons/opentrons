// TODO(mc, 2018-03-15): use babel with flow preset
// api updater
'use strict'

const assert = require('assert')
const fse = require('fs-extra')
const path = require('path')

const {version: AVAILABLE_UPDATE} = require('../package.json')
const log = require('./log')(__filename)

let updateFiles = []

module.exports = {
  AVAILABLE_UPDATE,
  initialize,
  getUpdateFiles
}

function initialize () {
  updateFiles = [
    // API update
    {
      id: 'whl',
      directory: path.join(__dirname, '../../api/dist'),
      ext: '.whl'
    },

    // API server lib update
    {
      id: 'serverlib',
      directory: path.join(__dirname, '../../api-server-lib/dist'),
      ext: '.whl'
    },

    // firmware update
    {
      id: 'fw',
      directory: path.join(__dirname, '../../api/smoothie'),
      ext: '.hex'
    }
  ].map(findUpdateFile)
}

function getUpdateFiles () {
  if (!updateFiles.length || !updateFiles.every(Boolean)) {
    return Promise.reject(new Error('Update files were not all found'))
  }

  return Promise.all(updateFiles.map(readUpdateFile))
}

function findUpdateFile (file) {
  const {directory, ext} = file

  try {
    const results = fse.readdirSync(directory)
    const files = results.filter(f => f.endsWith(ext))

    assert(
      files.length === 1,
      `Expected 1 ${ext} file in ${directory}, found ${results.join(' ')}`
    )

    const updateFile = Object.assign({name: files[0]}, file)
    log.info(`Found update file`, updateFile)

    return updateFile
  } catch (error) {
    log.error('Unable to load API update files', {error})
  }

  return null
}

function readUpdateFile (file) {
  return fse.readFile(path.join(file.directory, file.name))
    .then(contents => Object.assign({contents}, file))
}
