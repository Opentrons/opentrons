// @flow
// protocol state and loading actions
import { createSelector } from 'reselect'

import {
  fileToProtocolFile,
  parseProtocolData,
  filenameToType,
} from './protocol-data'

import type { Selector } from 'reselect'
import type { State, Action, ThunkAction } from '../types'
import type { ProtocolState, ProtocolFile, ProtocolData } from './types'

export * from './types'

type OpenProtocolAction = {|
  type: 'protocol:OPEN',
  payload: {| file: ProtocolFile |},
|}

type UploadProtocolAction = {|
  type: 'protocol:UPLOAD',
  payload: {| contents: string, data: ?ProtocolData |},
  meta: {| robot: true |},
|}

export type ProtocolAction = OpenProtocolAction | UploadProtocolAction

export function openProtocol (file: File): ThunkAction {
  return dispatch => {
    const reader = new FileReader()
    const protocolFile = fileToProtocolFile(file)
    const openAction: OpenProtocolAction = {
      type: 'protocol:OPEN',
      payload: { file: protocolFile },
    }

    reader.onload = () => {
      // because we use readAsText below, reader.result will be a string
      const contents: string = (reader.result: any)
      const uploadAction: UploadProtocolAction = {
        type: 'protocol:UPLOAD',
        payload: { contents, data: parseProtocolData(protocolFile, contents) },
        meta: { robot: true },
      }

      dispatch(uploadAction)
    }

    reader.readAsText(file)
    return dispatch(openAction)
  }
}

const INITIAL_STATE = { file: null, contents: null, data: null }

export function protocolReducer (
  state: ProtocolState = INITIAL_STATE,
  action: Action
): ProtocolState {
  switch (action.type) {
    case 'protocol:OPEN':
      return { ...INITIAL_STATE, ...action.payload }

    case 'protocol:UPLOAD':
      return { ...state, ...action.payload }

    case 'robot:SESSION_RESPONSE': {
      const {name, protocolText: contents} = action.payload
      const file = !state.file || name !== state.file.name
        ? {name, type: filenameToType(name), lastModified: null}
        : state.file
      const data = !state.contents || contents !== state.contents
        ? parseProtocolData(file, contents)
        : state.data

      return {file, contents, data}
    }

    case 'robot:DISCONNECT_RESPONSE':
      return INITIAL_STATE
  }

  return state
}

type StringSelector = Selector<State, void, ?string>

export const getProtocolFile = (state: State) => state.protocol.file

export const getProtocolFilename: StringSelector = createSelector(
  getProtocolFile,
  file => file && file.name
)
