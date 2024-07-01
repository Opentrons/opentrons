// protocol storage reducer
import keyBy from 'lodash/keyBy'
import without from 'lodash/without'
import * as Actions from './actions'

import type { Action } from '../types'
import type { ProtocolStorageState } from './types'
import type { Reducer } from 'redux'

export const INITIAL_STATE: ProtocolStorageState = {
  protocolKeys: [],
  filesByProtocolKey: {},
  inProgressAnalysisProtocolKeys: [],
  addFailureFile: null,
  addFailureMessage: null,
  listFailureMessage: null,
  code: null,
  analysis: null,
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
    case Actions.ADD_ANALYSIS: {
      return {
        ...state,
        analysis: action.payload.analysis,
      }
    }
    case Actions.ANALYZE_CREATE_PROTOCOL: {
      return {
        ...state,
        code: action.payload.code,
      }
    }
    case Actions.ANALYZE_PROTOCOL: {
      return {
        ...state,
        inProgressAnalysisProtocolKeys: [
          ...state.inProgressAnalysisProtocolKeys,
          action.payload.protocolKey,
        ],
      }
    }

    case Actions.ANALYZE_PROTOCOL_SUCCESS:
    case Actions.ANALYZE_PROTOCOL_FAILURE: {
      return {
        ...state,
        inProgressAnalysisProtocolKeys: without(
          state.inProgressAnalysisProtocolKeys,
          action.payload.protocolKey
        ),
      }
    }
  }

  return state
}
