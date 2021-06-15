import {
  fileExtensionIsPython,
  fileExtensionIsJson,
  fileExtensionIsZip,
} from '@opentrons/shared-data/js/helpers/validateJsonProtocolFile'
import { TYPE_JSON, TYPE_PYTHON, TYPE_ZIP } from './constants'
import type { ProtocolType } from './types'

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return global.btoa(binary)
}

export function filenameToType(filename: string): ProtocolType | null {
  if (fileExtensionIsJson(filename)) return TYPE_JSON
  if (fileExtensionIsPython(filename)) return TYPE_PYTHON
  if (fileExtensionIsZip(filename)) return TYPE_ZIP
  return null
}
