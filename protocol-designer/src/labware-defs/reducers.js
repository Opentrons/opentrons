// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { Action } from '../types'
import type { CreateCustomLabwareDef } from './actions'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
type CustomDefs = { [defId: string]: LabwareDefinition2 }

const customDefs = handleActions(
  {
    CREATE_CUSTOM_LABWARE_DEF: (
      state: CustomDefs,
      action: CreateCustomLabwareDef
    ): CustomDefs => ({
      ...state,
      [action.payload.def.otId]: action.payload,
    }),
  },
  {}
)

export type RootState = {
  customDefs: CustomDefs,
}

const _allReducers = {
  customDefs,
}

export const rootReducer = combineReducers<_, Action>(_allReducers)
