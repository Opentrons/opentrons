// protocol state and loading actions
import {
  parseProtocolData,
  fileIsBinary,
} from '@opentrons/shared-data/js/helpers'
import { arrayBufferToBase64, filenameToType } from './utils'

import type { ThunkAction } from '../types'
import type {
  OpenProtocolAction,
  UploadProtocolAction,
  LoadProtocolAction,
  CloseProtocolAction,
  ProtocolData,
} from './types'

import type { ProtocolParseErrorHandler } from '@opentrons/shared-data/js/helpers'

const VALIDATION_ERROR_T_MAP: { [errorKey: string]: string } = {
  INVALID_FILE_TYPE: 'invalid_file_type',
  INVALID_JSON_FILE: 'invalid_json_file',
}

export function openProtocol(file: File): ThunkAction {
  return dispatch => {
    const reader = new FileReader()

    reader.onload = () => {
      // when we use readAsText below, reader.result will be a string,
      // with readAsArrayBuffer, it will be an ArrayBuffer
      const _contents: any = reader.result
      const contents = fileIsBinary(file)
        ? arrayBufferToBase64(_contents)
        : _contents

      const handleParseErrors: ProtocolParseErrorHandler = (
        errorKey,
        errorDetails
      ) => {
        const message =
          errorDetails && 'rawError' in errorDetails
            ? errorDetails.rawError
            : null
        const schemaErrors =
          errorDetails && 'schemaErrors' in errorDetails
            ? errorDetails.schemaErrors
            : null
        // dispatch({
        //   type: 'protocol:INVALID_FILE',
        //   payload: {
        //     message,
        //     schemaErrors,
        //   },
        // })
        // if (errorKey === 'INVALID_FILE_TYPE') {
        // } else if (errorKey === 'INVALID_JSON_FILE') {
        // }
      }

      const uploadAction: UploadProtocolAction = {
        type: 'protocol:UPLOAD',
        payload: {
          contents,
          data: parseProtocolData(file, contents, handleParseErrors),
        },
        meta: { robot: true },
      }

      dispatch(uploadAction)
    }

    if (fileIsBinary(file)) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }

    const openAction: OpenProtocolAction = {
      type: 'protocol:OPEN',
      payload: {
        file: {
          name: file.name,
          type: filenameToType(file.name),
          lastModified: file.lastModified,
        },
      },
    }
    return dispatch(openAction)
  }
}

export function loadProtocol(
  file: File,
  data: ProtocolData | null
): LoadProtocolAction {
  return {
    type: 'protocol:LOAD',
    payload: {
      file: {
        name: file.name,
        type: filenameToType(file.name),
        lastModified: file.lastModified,
      },
      data,
    },
  }
}

export function closeProtocol(): CloseProtocolAction {
  return {
    type: 'protocol:CLOSE',
  }
}
