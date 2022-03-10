// custom labware reducer
import keyBy from 'lodash/keyBy'
import * as Actions from './actions'

import type { Action } from '../types'
import type { ProtocolStorageState } from './types'
import { Reducer } from 'redux'

export const INITIAL_STATE: ProtocolStorageState = {
  protocolKeys: [],
  filesByProtocolKey: {},
  addFailureFile: null,
  addFailureMessage: null,
  listFailureMessage: null,
}

export const protocolStorageReducer: Reducer<ProtocolStorageState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Actions.UPDATE_PROTOCOL_LIST: {
      return {
        ...state,
        listFailureMessage: null,
        protocolKeys: action.payload.map(f => f.protocolKey),
        filesByProtocolKey: keyBy(action.payload, 'protocolKey'),
      }
    }

    case Actions.UPDATE_PROTOCOL_LIST_FAILURE: {
      return { ...state, listFailureMessage: action.payload.message }
    }

    case Actions.ADD_PROTOCOL:
    case Actions.CLEAR_ADD_PROTOCOL_FAILURE: {
      return { ...state, addFailureFile: null, addFailureMessage: null }
    }

    case Actions.ADD_PROTOCOL_FAILURE: {
      return {
        ...state,
        addFailureFile: action.payload.protocol,
        addFailureMessage: action.payload.message,
      }
    }
  }

  return state
}
