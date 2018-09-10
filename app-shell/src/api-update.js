// api updater
import assert from 'assert'
import fse from 'fs-extra'
import path from 'path'

import pkg from '../package.json'
import createLogger from './log'

const log = createLogger(__filename)

let updateFiles = []

export const AVAILABLE_UPDATE = pkg.version

export function initialize () {
  updateFiles = [
    // API update
    {
      id: 'whl',
      directory: path.join(__dirname, '../../api/dist'),
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

export function getUpdateFiles () {
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
