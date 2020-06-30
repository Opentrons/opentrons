// @flow
// protocol state and loading actions
import { getFeatureFlags } from '../config/selectors'
import type { ThunkAction } from '../types'
import {
  fileToProtocolFile,
  parseProtocolData,
  fileIsBinary,
  fileIsBundle,
} from './protocol-data'

import type {
  OpenProtocolAction,
  UploadProtocolAction,
  InvalidProtocolFileAction,
} from './types'

export * from './constants'
export * from './selectors'

const BUNDLE_UPLOAD_DISABLED =
  'ZIP uploads are not currently supported. Please unzip the ZIP archive and upload the uncompressed files.'

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return global.btoa(binary)
}

export function openProtocol(file: File): ThunkAction {
  return (dispatch, getState) => {
    const reader = new FileReader()
    const protocolFile = fileToProtocolFile(file)
    const openAction: OpenProtocolAction = {
      type: 'protocol:OPEN',
      payload: { file: protocolFile },
    }
    const bundlesEnabled =
      getFeatureFlags(getState())?.enableBundleUpload === true

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

    if (fileIsBundle(protocolFile) && !bundlesEnabled) {
      const invalidFileAction: InvalidProtocolFileAction = {
        type: 'protocol:INVALID_FILE',
        payload: {
          file: protocolFile,
          message: BUNDLE_UPLOAD_DISABLED,
        },
      }
      return dispatch(invalidFileAction)
    }

    if (fileIsBinary(protocolFile)) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
    return dispatch(openAction)
  }
}
