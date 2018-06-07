// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'

import {updateFileMetadataFields, updatePipettes} from '../actions'
import {pipetteDataByName, type PipetteName} from '../pipetteData'

import type {Mount} from '@opentrons/components'
import type {PipetteData} from '../../step-generation'
import type {FileMetadataFields} from '../types'

const defaultFields = {
  name: '',
  author: '',
  description: ''
}

const unsavedMetadataForm = handleActions({
  UPDATE_FILE_METADATA_FIELDS: (state: FileMetadataFields, action: ActionType<typeof updateFileMetadataFields>) => ({
    ...state,
    ...action.payload
  }),
  SAVE_FILE_METADATA: (state: FileMetadataFields, action: ActionType<typeof saveFileMetadata>) => ({
    ...state,
    ...action.payload
  })
}, defaultFields)

const fileMetadata = handleActions({
  SAVE_FILE_METADATA: (state: FileMetadataFields, action: ActionType<typeof saveFileMetadata>) => ({
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

export type RootState = {
  unsavedMetadataForm: FileMetadataFields,
  fileMetadata: FileMetadataFields,
  pipettes: PipetteState
}

const _allReducers = {
  unsavedMetadataForm,
  fileMetadata,
  pipettes
}

export const rootReducer = combineReducers(_allReducers)
