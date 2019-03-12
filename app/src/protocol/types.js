// @flow
// protocol type defs
import type {ProtocolFileV1} from '@opentrons/shared-data'

export type ProtocolData = ProtocolFileV1<{}>
// NOTE: add union of additional versions after schema is bumped

// A fragment with only the metadata part
export type ProtocolMetadata = {
  metadata: $PropertyType<ProtocolFileV1<{}>, 'metadata'>,
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
