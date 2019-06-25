// @flow
// buildroot updater files
import path from 'path'
import assert from 'assert'
import fse from 'fs-extra'
import { app } from 'electron'

import createLogger from './log'
import { getConfig } from './config'

import type { BuildrootUpdateInfo } from '@opentrons/app/src/shell'
import type { Action } from '@opentrons/app/src/types'

type Dispatch = Action => void

const log = createLogger(__filename)

const userDataPath = app.getPath('userData') // how do we want to handle user upload vs auto-download

const BUILDROOT_DIRECTORY = '__ot_buildroot__'
const DIRECTORY = path.join(userDataPath, BUILDROOT_DIRECTORY)
const UPDATE_EXTENSION = '.zip'
const VERSION_EXTENSION = '.json'

let updateFilename: string
let updateApiVersion: string
let updateServerVersion: string

export function registerBuildrootUpdate(dispatch: Dispatch) {
  const buildrootEnabled = getConfig('devInternal').enableBuildRoot

  if (buildrootEnabled) {
    initializeUpdateFileInfo()
  }

  return function handleAction(action: Action) {
    if (buildrootEnabled) {
      switch (action.type) {
        case 'shell:CHECK_UPDATE':
          const payload = getBuildrootUpdateInfo()
          dispatch({ type: 'buildroot:UPDATE_INFO', payload })
      }
    }
  }
}

export function getBuildrootUpdateInfo(): BuildrootUpdateInfo | null {
  if (updateFilename && updateApiVersion && updateServerVersion) {
    return {
      filename: path.basename(updateFilename),
      apiVersion: updateApiVersion,
      serverVersion: updateServerVersion,
    }
  }

  return null
}

export function getUpdateFileContents(): Promise<Buffer> {
  if (updateFilename) {
    return Promise.reject(new Error('No buildroot file present'))
  }

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
