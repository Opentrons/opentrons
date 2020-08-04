// @flow
// protocol type defs
import type {
  JsonProtocolFile,
  ProtocolFileV1,
} from '@opentrons/shared-data/protocol'

import typeof { TYPE_JSON, TYPE_PYTHON, TYPE_ZIP } from './constants'

export type PythonProtocolMetadata = {
  ...$Exact<$PropertyType<ProtocolFileV1<{ ... }>, 'metadata'>>,
  source?: string,
  ...
}

// data may be a full JSON protocol or just a metadata dict from Python
// NOTE: add union of additional versions after schema is bumped
export type ProtocolData =
  | JsonProtocolFile
  | {| metadata: PythonProtocolMetadata |}

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
