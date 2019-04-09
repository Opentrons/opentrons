// @flow
// protocol type defs
import type { SchemaV1ProtocolFile } from '@opentrons/shared-data'

export type ProtocolData = SchemaV1ProtocolFile<{}>
// NOTE: add union of additional versions after schema is bumped

// A fragment with only the metadata part
export type ProtocolMetadata = {
  metadata: $PropertyType<SchemaV1ProtocolFile<{}>, 'metadata'>,
}

export type ProtocolFile = {
  name: string,
  type: ?string,
  lastModified: ?number,
}

export type ProtocolState = {
  file: ?ProtocolFile,
  contents: ?string,
  data: ?(ProtocolData | ProtocolMetadata),
}

export type ProtocolType = 'json' | 'python'
