// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'

import {updateFileFields} from '../actions'
import {pipetteDataByName, type PipetteName} from '../pipetteData'

import type {Mount} from '@opentrons/components'
import type {PipetteData} from '../../step-generation'
import type {FilePageFields} from '../types'

const defaultFields = {
  name: '',
  author: '',
  description: '',
  leftPipette: '',
  rightPipette: ''
}

const metadataFields = handleActions({
  UPDATE_FILE_FIELDS: (state: FilePageFields, action: ActionType<typeof updateFileFields>) => ({
    ...state,
    ...action.payload
  })
}, defaultFields)

type PipetteState = {|
  left: ?PipetteData,
  right: ?PipetteData
|}

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
  UPDATE_FILE_FIELDS: (state: PipetteState, action: ActionType<typeof updateFileFields>) => {
    const leftPipetteName = action.payload.leftPipette
    const rightPipetteName = action.payload.rightPipette

    return {
      left: leftPipetteName
        ? createPipette(leftPipetteName, 'left')
        : state.left,
      right: rightPipetteName
        ? createPipette(rightPipetteName, 'right')
        : state.right
    }
  }
}, {left: null, right: null})

export type RootState = {
  metadataFields: FilePageFields,
  pipettes: PipetteState
}

const _allReducers = {
  metadataFields,
  pipettes
}

export const rootReducer = combineReducers(_allReducers)
