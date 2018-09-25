// @flow
// api updater
import assert from 'assert'
import fse from 'fs-extra'
import path from 'path'

import pkg from '../package.json'
import createLogger from './log'

import type {ApiUpdateInfo} from '@opentrons/app/src/shell'

const log = createLogger(__filename)

const DIRECTORY = path.join(__dirname, '../../api/dist')
const EXTENSION = '.whl'
const RE_VERSION = /.+-(\d+\.\d+\.\d+)([ab])?(\d+)?-.+/
const SHORT_LABEL_TO_LABEL = {a: 'alpha', b: 'beta'}

let updateFilename: string
let updateVersion: string

export const AVAILABLE_UPDATE = pkg.version

export function registerApiUpdate () {
  initializeUpdateFileInfo()

  // API update does not need to handle actions at the moment
  return () => {}
}

export function getUpdateInfo (): ApiUpdateInfo {
  assert(updateFilename && updateVersion, 'Update info was not initialized')

  return {filename: path.basename(updateFilename), version: updateVersion}
}

export function getUpdateFileContents (): Promise<Buffer> {
  assert(updateFilename && updateVersion, 'Update info was not initialized')

  return fse.readFile(updateFilename)
}

function initializeUpdateFileInfo () {
  try {
    const results = fse.readdirSync(DIRECTORY)
    const files = results.filter(f => f.endsWith(EXTENSION))

    assert(
      files.length === 1,
      `Expected 1 ${EXTENSION} file in ${DIRECTORY}, found ${results.join(' ')}`
    )

    log.info(`Found update file`, {filename: files[0]})
    updateFilename = path.join(DIRECTORY, files[0])
    updateVersion = getVersionFromFilename(updateFilename)
  } catch (error) {
    log.error('Unable to load API update files', {error})
  }

  return null
}

function getVersionFromFilename (filename: string): string {
  const match = filename.toLowerCase().match(RE_VERSION)

  assert(match, `could not parse version from "${filename}"`)

  // $FlowFixMe: assert above means `match` exists here
  const [baseVersion, shortLabel, labelVersion] = match.slice(1)
  const label =
    shortLabel && labelVersion
      ? `-${SHORT_LABEL_TO_LABEL[shortLabel]}.${labelVersion}`
      : ''

  return `${baseVersion}${label}`
}
