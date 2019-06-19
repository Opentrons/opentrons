// @flow
// buildroot updater files
import path from 'path'
import assert from 'assert'
import fse from 'fs-extra'
import { app } from 'electron'

import createLogger from './log'

import type { BuildrootUpdateInfo } from '@opentrons/app/src/shell'

const log = createLogger(__filename)

const userDataPath = app.getPath('userData') // how do we want to handle user upload vs auto-download

const BUILDROOT_DIRECTORY = '__ot_buildroot__'
const DIRECTORY = path.join(userDataPath, BUILDROOT_DIRECTORY)
const UPDATE_EXTENSION = '.zip'
const VERSION_EXTENSION = '.json'

let updateFilename: string
let updateApiVersion: string
let updateServerVersion: string

export function registerBuildrootUpdate() {
  initializeUpdateFileInfo()
  return () => {}
}

export function getBuildrootUpdateInfo(): BuildrootUpdateInfo {
  try {
    assert(
      updateFilename && updateApiVersion && updateServerVersion,
      'Update info was not initialized'
    )

    return {
      filename: path.basename(updateFilename),
      apiVersion: updateApiVersion,
      serverVersion: updateServerVersion,
    }
  } catch (error) {
    log.error('Unable to detect Buildroot update files', { error })
  }
  return {
    filename: null,
    apiVersion: null,
    serverVersion: null,
  }
}

export function getUpdateFileContents(): Promise<Buffer> {
  assert(
    updateFilename && updateApiVersion && updateServerVersion,
    'Update file info was not initialized'
  )

  return fse.readFile(updateFilename)
}

function initializeUpdateFileInfo() {
  try {
    const results = fse.readdirSync(DIRECTORY)
    const files = results.filter(f => f.endsWith(UPDATE_EXTENSION))
    const versionFiles = results.filter(f => f.endsWith(VERSION_EXTENSION))
    assert(
      files.length === 1,
      `Expected 1 ${UPDATE_EXTENSION} file in ${DIRECTORY}, found ${results.join(
        ' '
      )}`
    )

    assert(
      versionFiles.length === 1,
      `Expected 1 ${VERSION_EXTENSION} file in ${DIRECTORY}, found ${results.join(
        ' '
      )}`
    )

    log.info(`Found update file`, { filename: files[0] })
    log.info(`Found version file`, { filename: versionFiles[0] })
    updateFilename = path.join(DIRECTORY, files[0])

    const versionFileName = path.join(DIRECTORY, versionFiles[0])
    const versionData = JSON.parse(fse.readFileSync(versionFileName))
    const { opentrons_api_version, update_server_version } = versionData

    updateApiVersion = opentrons_api_version
    updateServerVersion = update_server_version
  } catch (error) {
    log.error('Unable to load Buildroot update files', { error })
  }

  return null
}
