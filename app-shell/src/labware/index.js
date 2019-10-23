// @flow
import fse from 'fs-extra'
import { getFullConfig } from '../config'
import { readLabwareDirectory, parseLabwareFiles } from './definitions'
import { validateLabwareFiles } from './validation'
import * as labwareActions from '@opentrons/app/src/custom-labware/actions'

import type { Action, Dispatch } from '../types'

const ensureDir: (dir: string) => Promise<void> = fse.ensureDir

export function registerLabware(dispatch: Dispatch) {
  const { labware: config } = getFullConfig()

  return function handleActionForLabware(action: Action) {
    switch (action.type) {
      case labwareActions.FETCH_CUSTOM_LABWARE: {
        ensureDir(config.directory)
          .then(() => readLabwareDirectory(config.directory))
          .then(parseLabwareFiles)
          .then(files => {
            const payload = validateLabwareFiles(files)
            dispatch(labwareActions.customLabware(payload))
          })
      }
    }
  }
}
