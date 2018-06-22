// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'
import {pipetteDataByName, type PipetteName} from './pipetteData'
import {updatePipettes} from './actions'

import type {PipetteState} from './types'
import type {Mount} from '@opentrons/components'

function createPipette (name: PipetteName, mount: Mount) {
  const pipetteData = pipetteDataByName[name]
  if (!pipetteData) {
    // TODO Ian 2018-03-01 I want Flow to enforce `name` is a key in pipetteDataByName,
    // but it doesn't seem to want to be strict about it
    throw new Error('Invalid pipette name, no entry in pipetteDataByName')
  }
  return {
    id: `${mount}:${name}`,
    mount,
    maxVolume: pipetteData.maxVolume,
    channels: pipetteData.channels
  }
}

const pipettes = handleActions({
  UPDATE_PIPETTES: (state: PipetteState, action: ActionType<typeof updatePipettes>) => {
    const {left, right} = action.payload // left and/or right pipette names, eg 'P10 Single-Channel'

    return {
      left: left
        ? createPipette(left, 'left')
        : null,
      right: right
        ? createPipette(right, 'right')
        : null
    }
  }
}, {left: null, right: null})

const _allReducers = {
  pipettes
}

export const rootReducer = combineReducers(_allReducers)
