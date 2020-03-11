// @flow
// protocol type defs
import type { ProtocolFile as SchemaV1ProtocolFile } from '@opentrons/shared-data/protocol/flowTypes/schemaV1'
import type { ProtocolFile as SchemaV3ProtocolFile } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'

import typeof { TYPE_JSON, TYPE_PYTHON, TYPE_ZIP } from './constants'

// data may be a full JSON protocol or just a metadata dict from Python
export type ProtocolData =
  | SchemaV1ProtocolFile<{}>
  | SchemaV3ProtocolFile<{}>
  | { metadata: $PropertyType<SchemaV1ProtocolFile<{}>, 'metadata'> }
// NOTE: add union of additional versions after schema is bumped

export type ProtocolType = TYPE_JSON | TYPE_PYTHON | TYPE_ZIP

export type ProtocolFile = {
  name: string,
  type: ?ProtocolType,
  lastModified: ?number,
}

// action types

export type OpenProtocolAction = {|
  type: 'protocol:OPEN',
  payload: {| file: ProtocolFile |},
|}

export type UploadProtocolAction = {|
  type: 'protocol:UPLOAD',
  payload: {| contents: string, data: ProtocolData | null |},
  meta: {| robot: true |},
|}

export type InvalidProtocolFileAction = {|
  type: 'protocol:INVALID_FILE',
  payload: {| file: ProtocolFile, message: string |},
|}

export type ProtocolAction =
  | OpenProtocolAction
  | UploadProtocolAction
  | InvalidProtocolFileAction

// state types

export type ProtocolState = $ReadOnly<{|
  file: ProtocolFile | null,
  contents: string | null,
  data: ProtocolData | null,
|}>
