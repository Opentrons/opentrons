// @flow
import type { ProtocolFile as ProtocolFileV1 } from './flowTypes/schemaV1'
import type { ProtocolFile as ProtocolFileV3 } from './flowTypes/schemaV3'
import type { ProtocolFile as ProtocolFileV4 } from './flowTypes/schemaV4'
import type { ProtocolFile as ProtocolFileV5 } from './flowTypes/schemaV5'

export type { ProtocolFileV1, ProtocolFileV3, ProtocolFileV4, ProtocolFileV5 }

export type JsonProtocolFile =
  | $ReadOnly<$Exact<ProtocolFileV1<{ ... }>>>
  | $ReadOnly<ProtocolFileV3<{ ... }>>
  | $ReadOnly<ProtocolFileV4<{ ... }>>
  | $ReadOnly<ProtocolFileV5<{ ... }>>
