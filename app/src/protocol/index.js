// @flow
// protocol state and loading actions
import {
  fileToProtocolFile,
  parseProtocolData,
  filenameToMimeType,
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

// const arrayBufferToBase64 = (arrayBuffer: ArrayBuffer): string => {
//   var base64 = ''
//   var encodings =
//     'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

//   var bytes = new Uint8Array(arrayBuffer)
//   var byteLength = bytes.byteLength
//   var byteRemainder = byteLength % 3
//   var mainLength = byteLength - byteRemainder

//   var a, b, c, d
//   var chunk

//   // Main loop deals with bytes in chunks of 3
//   for (var i = 0; i < mainLength; i = i + 3) {
//     // Combine the three bytes into a single integer
//     chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

//     // Use bitmasks to extract 6-bit segments from the triplet
//     a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
//     b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
//     c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
//     d = chunk & 63 // 63       = 2^6 - 1

//     // Convert the raw binary segments to the appropriate ASCII encoding
//     base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
//   }

//   // Deal with the remaining bytes and padding
//   if (byteRemainder === 1) {
//     chunk = bytes[mainLength]

//     a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

//     // Set the 4 least significant bits to zero
//     b = (chunk & 3) << 4 // 3   = 2^2 - 1

//     base64 += encodings[a] + encodings[b] + '=='
//   } else if (byteRemainder === 2) {
//     chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

//     a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
//     b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

//     // Set the 2 least significant bits to zero
//     c = (chunk & 15) << 2 // 15    = 2^4 - 1

//     base64 += encodings[a] + encodings[b] + encodings[c] + '='
//   }

//   return base64
// }

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
      const contents = protocolFile.isBinary
        ? arrayBufferToBase64(_contents)
        : _contents
      console.log({
        contents,
        protocolFile,
        _contents,
        typeIs: typeof _contents,
      })
      const uploadAction: UploadProtocolAction = {
        type: 'protocol:UPLOAD',
        payload: { contents, data: parseProtocolData(protocolFile, contents) },
        meta: { robot: true },
      }

      dispatch(uploadAction)
    }

    if (protocolFile.isBinary) {
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
          ? { name, type: filenameToMimeType(name), lastModified: null }
          : state.file
      const data =
        !state.data || contents !== state.contents
          ? parseProtocolData(file, contents, metadata)
          : state.data

      return { file, contents, data }
    }

    case 'robot:DISCONNECT_RESPONSE':
      return INITIAL_STATE
  }

  return state
}
