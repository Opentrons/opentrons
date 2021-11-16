import {
  fileExtensionIsPython,
  fileExtensionIsJson,
  fileExtensionIsZip,
  fileIsBinary,
  parseProtocolData,
} from '@opentrons/shared-data/js/helpers'
import { TYPE_JSON, TYPE_PYTHON, TYPE_ZIP } from './constants'

import type { ProtocolType } from './types'
import type {
  ProtocolData,
  ProtocolParseErrorHandler,
} from '@opentrons/shared-data/js/helpers'

export function filenameToType(filename: string): ProtocolType | null {
  if (fileExtensionIsJson(filename)) return TYPE_JSON
  if (fileExtensionIsPython(filename)) return TYPE_PYTHON
  if (fileExtensionIsZip(filename)) return TYPE_ZIP
  return null
}

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return global.btoa(binary)
}

export function ingestProtocolFile(
  file: File,
  handleSuccess: (file: File, data: ProtocolData | null) => unknown,
  handleError?: ProtocolParseErrorHandler
): void {
  const reader = new FileReader()

  reader.onload = () => {
    // when we use readAsText below, reader.result will be a string,
    // with readAsArrayBuffer, it will be an ArrayBuffer
    const _contents: any = reader.result
    const contents = fileIsBinary(file)
      ? arrayBufferToBase64(_contents)
      : _contents

    const protocolData = parseProtocolData(file, contents, handleError)
    handleSuccess(file, protocolData)
  }

  if (fileIsBinary(file)) {
    reader.readAsArrayBuffer(file)
  } else {
    reader.readAsText(file)
  }
}
