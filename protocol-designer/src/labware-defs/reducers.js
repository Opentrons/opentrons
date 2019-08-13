// @flow
import omit from 'lodash/omit'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { getLabwareDefURI } from '@opentrons/shared-data'
import type { Action } from '../types'
import type { LabwareUploadMessage, LabwareDefByDefURI } from './types'
import type {
  CreateCustomLabwareDef,
  ReplaceCustomLabwareDefs,
  LabwareUploadMessageAction,
} from './actions'
const customDefs = handleActions(
  {
    CREATE_CUSTOM_LABWARE_DEF: (
      state: LabwareDefByDefURI,
      action: CreateCustomLabwareDef
    ): LabwareDefByDefURI => {
      const uri = getLabwareDefURI(action.payload.def)
      return {
        ...state,
        [uri]: action.payload.def,
      }
    },
    REPLACE_CUSTOM_LABWARE_DEFS: (state, action: ReplaceCustomLabwareDefs) => ({
      ...omit(state, action.payload.defURIsToOverwrite),
      [getLabwareDefURI(action.payload.newDef)]: action.payload.newDef,
    }),
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
    REPLACE_CUSTOM_LABWARE_DEFS: () => null,
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
