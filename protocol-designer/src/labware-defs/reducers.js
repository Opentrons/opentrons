// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { Action } from '../types'
import type { CreateCustomLabwareDef } from './actions'
import {
  getLabwareDefURI,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
type CustomDefs = { [defLookup: string]: LabwareDefinition2 }

const customDefs = handleActions(
  {
    CREATE_CUSTOM_LABWARE_DEF: (
      state: CustomDefs,
      action: CreateCustomLabwareDef
    ): CustomDefs => {
      const lookup = getLabwareDefURI(action.payload.def)
      if (lookup in state) {
        console.warn(`overwriting custom labware ${lookup}`)
      }
      return {
        ...state,
        [lookup]: action.payload.def,
      }
    },
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
