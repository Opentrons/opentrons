// @flow
// custom labware reducer
import * as ActionTypes from './actions'

import type { Action } from '../types'
import type { CustomLabwareState } from './types'

export const INITIAL_STATE: CustomLabwareState = {
  filenames: [],
  filesByName: {},
  addFileFailure: null,
}

export function customLabwareReducer(
  state: CustomLabwareState = INITIAL_STATE,
  action: Action
): CustomLabwareState {
  switch (action.type) {
    case ActionTypes.CUSTOM_LABWARE: {
      const { filenames, filesByName } = action.payload.reduce(
        (res, file) => {
          res.filenames.push(file.filename)
          res.filesByName[file.filename] = file
          return res
        },
        { filenames: [], filesByName: {} }
      )

      return { ...state, filenames, filesByName }
    }

    case ActionTypes.ADD_CUSTOM_LABWARE:
    case ActionTypes.CLEAR_ADD_CUSTOM_LABWARE_FAILURE: {
      return { ...state, addFileFailure: null }
    }

    case ActionTypes.ADD_CUSTOM_LABWARE_FAILURE: {
      return { ...state, addFileFailure: action.payload.labware }
    }
  }

  return state
}
