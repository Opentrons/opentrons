// @flow
// protocol state and loading actions
import {
  fileToProtocolFile,
  parseProtocolData,
  filenameToType,
  fileIsBinary,
} from './protocol-data'

import type { Action, ThunkAction } from '../types'
import type { ProtocolState, ProtocolFile } from './types'

export * from './types'
export * from './selectors'

type OpenProtocolAction = {|
  type: 'protocol:OPEN',
  payload: {| file: ProtocolFile |},
|}

type UploadProtocolAction = {|
  type: 'protocol:UPLOAD',
  payload: {| contents: string, data: $PropertyType<ProtocolState, 'data'> |},
  meta: {| robot: true |},
|}

export type ProtocolAction = OpenProtocolAction | UploadProtocolAction

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  let bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return global.btoa(binary)
}

export function openProtocol(file: File): ThunkAction {
  return dispatch => {
    const reader = new FileReader()
    const protocolFile = fileToProtocolFile(file)
    const openAction: OpenProtocolAction = {
      type: 'protocol:OPEN',
      payload: { file: protocolFile },
    }

    reader.onload = () => {
      // when we use readAsText below, reader.result will be a string,
      // with readAsArrayBuffer, it will be an ArrayBuffer
      const _contents: any = reader.result
      const contents = fileIsBinary(protocolFile)
        ? arrayBufferToBase64(_contents)
        : _contents

      const uploadAction: UploadProtocolAction = {
        type: 'protocol:UPLOAD',
        payload: { contents, data: parseProtocolData(protocolFile, contents) },
        meta: { robot: true },
      }

      dispatch(uploadAction)
    }

    if (fileIsBinary(protocolFile)) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
    return dispatch(openAction)
  }
}

const INITIAL_STATE = { file: null, contents: null, data: null }

export function protocolReducer(
  state: ProtocolState = INITIAL_STATE,
  action: Action
): ProtocolState {
  switch (action.type) {
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
