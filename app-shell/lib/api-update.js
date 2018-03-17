// @flow
// TODO(mc, 2018-03-15): use babel with flow preset instead of comments
// api updater
'use strict'

const fs = require('fs')
const path = require('path')
const {promisify} = require('util')
const semver = require('semver')

const {version: LATEST_VERSION} = require('../package.json')

const readDir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)

/*::
import type {RobotService} from '../../app/src/robot'
import type {RobotHealth} from '../../app/src/http-api-client'
*/

const UPDATE_EXT = '.whl'
const UPDATE_DIR = path.join(__dirname, '../../api/dist')
let updateFile

module.exports = {
  initialize,
  getUpdateAvailable,
  getUpdateFile
}

function initialize () /*: Promise<void> */ {
  return readDir(UPDATE_DIR)
    .then((files) => {
      const wheels = files.filter((file) => file.endsWith(UPDATE_EXT))

      if (wheels.length !== 1) {
        return Promise.reject(new Error(
          `Expected 1 wheel, got ${wheels.length} of ${files.length} files`
        ))
      }

      updateFile = wheels[0]
    })
}

function getUpdateAvailable (robotVersion /*: string */) /*: boolean */ {
  return semver.gt(LATEST_VERSION, robotVersion)
}

function getUpdateFile () /*: Promise<string> */ {
  if (!updateFile) return Promise.reject(new Error('No update file available'))

  return readFile(path.join(UPDATE_DIR, updateFile))
    .then((contents) => ({name: updateFile, contents}))
}
