// @flow
// protocol state and loading actions
import {
  fileToProtocolFile,
  parseProtocolData,
  fileIsBinary,
} from './protocol-data'

import type { ThunkAction } from '../types'
import type { OpenProtocolAction, UploadProtocolAction } from './types'

export * from './selectors'

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
