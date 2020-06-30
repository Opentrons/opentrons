// @flow
// custom labware reducer
import keyBy from 'lodash/keyBy'
import type { Action } from '../types'
import * as Actions from './actions'

import type { CustomLabwareState } from './types'

export const INITIAL_STATE: CustomLabwareState = {
  filenames: [],
  filesByName: {},
  addFailureFile: null,
  addFailureMessage: null,
  listFailureMessage: null,
}

export function customLabwareReducer(
  state: CustomLabwareState = INITIAL_STATE,
  action: Action
): CustomLabwareState {
  switch (action.type) {
    case Actions.CUSTOM_LABWARE_LIST: {
      return {
        ...state,
        listFailureMessage: null,
        filenames: action.payload.map(f => f.filename),
        filesByName: keyBy(action.payload, 'filename'),
      }
    }

    case Actions.CUSTOM_LABWARE_LIST_FAILURE: {
      return { ...state, listFailureMessage: action.payload.message }
    }

    case Actions.ADD_CUSTOM_LABWARE:
    case Actions.CLEAR_ADD_CUSTOM_LABWARE_FAILURE: {
      return { ...state, addFailureFile: null, addFailureMessage: null }
    }

    case Actions.ADD_CUSTOM_LABWARE_FAILURE: {
      return {
        ...state,
        addFailureFile: action.payload.labware,
        addFailureMessage: action.payload.message,
      }
    }
  }

  return state
}
