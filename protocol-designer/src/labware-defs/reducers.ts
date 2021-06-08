import omit from 'lodash/omit'
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import pickBy from 'lodash/pickBy'
import {
  getLabwareDefURI,
  getLabwareDefIsStandard,
} from '@opentrons/shared-data'
import { Reducer } from 'redux'
import { Action } from '../types'
import { LabwareUploadMessage, LabwareDefByDefURI } from './types'
import {
  CreateCustomLabwareDef,
  LabwareUploadMessageAction,
  ReplaceCustomLabwareDef,
} from './actions'
import { LoadFileAction } from '../load-file'
const customDefs = handleActions(
  {
    CREATE_CUSTOM_LABWARE_DEF: (
      state: LabwareDefByDefURI,
      action: CreateCustomLabwareDef
    ): LabwareDefByDefURI => {
      const uri = getLabwareDefURI(action.payload.def)
      return { ...state, [uri]: action.payload.def }
    },
    REPLACE_CUSTOM_LABWARE_DEF: (
      state: LabwareDefByDefURI,
      action: ReplaceCustomLabwareDef
    ) => ({
      ...omit(state, action.payload.defURIToOverwrite),
      [getLabwareDefURI(action.payload.newDef)]: action.payload.newDef,
    }),
    LOAD_FILE: (state: LabwareDefByDefURI, action: LoadFileAction) => {
      const customDefsFromFile = pickBy(
        action.payload.file.labwareDefinitions,
        def => !getLabwareDefIsStandard(def) // assume if it's not standard, it's custom
      )
      return { ...state, ...customDefsFromFile }
    },
  },
  {}
)
const labwareUploadMessage = handleActions<
  LabwareUploadMessage | null | undefined,
  any
>(
  {
    LABWARE_UPLOAD_MESSAGE: (
      state,
      action: LabwareUploadMessageAction
    ): LabwareUploadMessage => action.payload,
    CREATE_CUSTOM_LABWARE_DEF: () => null,
    REPLACE_CUSTOM_LABWARE_DEF: () => null,
    DISMISS_LABWARE_UPLOAD_MESSAGE: () => null,
  },
  null
)
export type RootState = {
  customDefs: LabwareDefByDefURI
  labwareUploadMessage: LabwareUploadMessage | null | undefined
}
const _allReducers = {
  customDefs,
  labwareUploadMessage,
}
export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _allReducers
)
