// @flow
// functions for parsing protocol files
// import path from 'path'
// import {getter} from '@thi.ng/paths'
import createLogger from '../logger'

import type { ProtocolFile, ProtocolData, ProtocolType } from './types'

const log = createLogger(__filename)

export const MIME_TYPE_JSON = 'application/json'
export const MIME_TYPE_PYTHON = 'text/x-python-script'

export function fileToProtocolFile(file: File): ProtocolFile {
  return {
    name: file.name,
    type: file.type,
    // $FlowFixMe: upgrade to flow v0.80 for fixed File typedef
    lastModified: file.lastModified,
  }
}

export function parseProtocolData(
  file: ProtocolFile,
  contents: string,
  // optional Python protocol metadata
  metadata: ?$PropertyType<ProtocolData, 'metadata'>
): ProtocolData | null {
  if (fileIsJson(file)) {
    try {
      return JSON.parse(contents)
    } catch (e) {
      // TODO(mc, 2018-09-05): surface parse error to user prior to upload
      log.warn('Failed to parse JSON', { contents, message: e.message })
    }
  } else if (metadata) {
    // grab Python protocol metadata, if any
    return { metadata }
  }

  return null
}

export function filenameToMimeType(name: string): string | null {
  if (name.endsWith('.json')) return MIME_TYPE_JSON
  if (name.endsWith('.py')) return MIME_TYPE_PYTHON
  return null
}

export function fileToType(file: ?ProtocolFile): ProtocolType | null {
  if (file?.type === MIME_TYPE_JSON) return 'json'
  if (file?.type === MIME_TYPE_PYTHON) return 'python'
  return null
}

export function fileIsJson(file: ProtocolFile): boolean {
  return file.type === MIME_TYPE_JSON
}
