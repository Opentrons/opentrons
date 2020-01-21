// @flow
// functions for parsing protocol files
import { createLogger } from '../logger'

import type { ProtocolFile, ProtocolData, ProtocolType } from './types'

const log = createLogger(__filename)

export function filenameToType(filename: string): ProtocolType | null {
  if (filename.endsWith('.json')) return 'json'
  if (filename.endsWith('.py')) return 'python'
  if (filename.endsWith('.zip')) return 'zip'
  return null
}

export function fileToProtocolFile(file: File): ProtocolFile {
  return {
    name: file.name,
    type: filenameToType(file.name),
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
    // $FlowFixMe: (ka, 2019-06-10): cant differentiate which file schema file is needed
    return { metadata }
  }

  return null
}

export function fileIsPython(file: ProtocolFile): boolean {
  return file.type === 'python' || file.type == null
}

export function fileIsJson(file: ProtocolFile): boolean {
  return file.type === 'json'
}

export function fileIsBundle(file: ProtocolFile): boolean {
  return file.type === 'zip'
}

export function fileIsBinary(file: ProtocolFile): boolean {
  // bundles are always binary files, and currently nothing else is binary
  return fileIsBundle(file)
}
