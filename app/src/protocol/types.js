// @flow
// protocol type defs
import type { SchemaV1ProtocolFile } from '@opentrons/shared-data'

// data may be a full JSON protocol or just a metadata dict from Python
export type ProtocolData =
  | SchemaV1ProtocolFile<{}>
  | { metadata: $PropertyType<SchemaV1ProtocolFile<{}>, 'metadata'> }
// NOTE: add union of additional versions after schema is bumped

export type ProtocolFile = {
  name: string,
  type: ?string,
  lastModified: ?number,
}

export type ProtocolState = {
  file: ?ProtocolFile,
  contents: ?string,
  data: ?ProtocolData,
}

export type ProtocolType = 'json' | 'python'
