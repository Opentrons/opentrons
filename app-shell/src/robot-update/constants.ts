import path from 'path'
import { app } from 'electron'
import type { UpdateManifestUrls } from './types'
import type { RobotUpdateTarget } from '@opentrons/app/src/redux/robot-update/types'
import { CURRENT_VERSION } from '../update'
export CURRENT_VERSION
export const UPDATE_MANIFEST_URLS_RELEASE = {
  ot2: 'https://builds.opentrons.com/ot2-br/releases.json',
  flex: 'https://builds.opentrons.com/ot3-oe/releases.json',
}

export const UPDATE_MANIFEST_URLS_INTERNAL_RELEASE = {
  ot2: 'https://ot3-development.builds.opentrons.com/ot2-br/releases.json',
  flex: 'https://ot3-development.builds.opentrons.com/ot3-oe/releases.json',
}

export const UPDATE_MANIFEST_URLS = (): UpdateManifestUrls =>
  _OPENTRONS_PROJECT_.includes('robot-stack')
    ? UPDATE_MANIFEST_URLS_RELEASE
    : UPDATE_MANIFEST_URLS_INTERNAL_RELEASE

const DIRECTORY = path.join(app.getPath('userData'), 'robot-update-cache')
export const CACHE_DIR_FOR_MACHINE = (machine: RobotUpdateTarget): string => path.join(DIRECTORY, machine)
export const CACHE_DIR_FOR_MACHINE_FILES = (machine: RobotUpdateTarget): string => path.join(CACHE_DIR_FOR_MACHINE(machine), CURRENT_VERSION)
