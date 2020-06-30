// @flow
import type { Action } from '../types'
import { filenameToType, parseProtocolData } from './protocol-data'

import type { ProtocolState } from './types'

const INITIAL_STATE: ProtocolState = { file: null, contents: null, data: null }

export function protocolReducer(
  state: ProtocolState = INITIAL_STATE,
  action: Action
): ProtocolState {
  switch (action.type) {
    case 'protocol:INVALID_FILE':
      return { ...INITIAL_STATE, file: action.payload.file }

    case 'protocol:OPEN':
      return { ...INITIAL_STATE, ...action.payload }

    case 'protocol:UPLOAD':
      return { ...state, ...action.payload }

    case 'robot:SESSION_RESPONSE': {
      const { name, metadata, protocolText: contents } = action.payload
      const file =
        !state.file || name !== state.file.name
          ? { name, type: filenameToType(name), lastModified: null }
          : state.file
      const data =
        !state.data ||
        (typeof contents === 'string' && contents !== state.contents)
          ? parseProtocolData(file, contents, metadata)
          : state.data

      return { file, contents, data }
    }

    case 'robot:DISCONNECT_RESPONSE':
      return INITIAL_STATE
  }

  return state
}
