// @flow
// functions for parsing protocol files
// import path from 'path'
// import {getter} from '@thi.ng/paths'
import createLogger from '../logger'

import type {ProtocolFile, ProtocolData} from './types'

const log = createLogger(__filename)

const MIME_TYPE_JSON = 'application/json'

export function fileToProtocolFile (file: File): ProtocolFile {
  return {
    name: file.name,
    type: file.type,
    // $FlowFixMe: upgrade to flow v0.80 for fixed File typedef
    lastModified: file.lastModified,
  }
}

export function parseProtocolData (
  file: ProtocolFile,
  contents: string
): ?ProtocolData {
  if (fileIsJson(file)) {
    try {
      return JSON.parse(contents)
    } catch (e) {
      // TODO(mc, 2018-09-05): surface parse error to user prior to upload
      log.warn('Failed to parse JSON', {contents, message: e.message})
    }
  }

  return null
}

export function filenameToType (name: string): ?string {
  if (name.endsWith('.json')) return MIME_TYPE_JSON
  return null
}

export function fileIsJson (file: ProtocolFile): boolean {
  return file.type === MIME_TYPE_JSON
}
