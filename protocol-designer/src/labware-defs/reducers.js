// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { getLabwareDefURI } from '@opentrons/shared-data'
import type { Action } from '../types'
import type { LabwareUploadMessage, LabwareDefByDefURI } from './types'
import type {
  CreateCustomLabwareDef,
  LabwareUploadMessageAction,
} from './actions'
const customDefs = handleActions(
  {
    CREATE_CUSTOM_LABWARE_DEF: (
      state: LabwareDefByDefURI,
      action: CreateCustomLabwareDef
    ): LabwareDefByDefURI => {
      const uri = getLabwareDefURI(action.payload.def)
      if (uri in state && action.payload.overwrite !== true) {
        console.warn(`overwriting custom labware ${uri}`)
      }
      return {
        ...state,
        [uri]: action.payload.def,
      }
    },
  },
  {}
)

const labwareUploadMessage = handleActions<?LabwareUploadMessage, *>(
  {
    LABWARE_UPLOAD_MESSAGE: (
      state,
      action: LabwareUploadMessageAction
    ): LabwareUploadMessage => action.payload,
    CREATE_CUSTOM_LABWARE_DEF: () => null,
    DISMISS_LABWARE_UPLOAD_MESSAGE: () => null,
  },
  null
)

export type RootState = {
  customDefs: LabwareDefByDefURI,
  labwareUploadMessage: ?LabwareUploadMessage,
}

const _allReducers = {
  customDefs,
  labwareUploadMessage,
}

export const rootReducer = combineReducers<_, Action>(_allReducers)
