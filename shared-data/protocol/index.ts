import type { ProtocolFile as _ProtocolFileV1 } from './types/schemaV1'
import type { ProtocolFile as _ProtocolFileV3 } from './types/schemaV3'
import type { ProtocolFile as _ProtocolFileV4 } from './types/schemaV4'
import type { ProtocolFile as _ProtocolFileV5 } from './types/schemaV5'

// TODO(mc, 2021-04-27): these awkward re-exports only for flowgen support
// remove when able
export type ProtocolFileV1<AppData> = _ProtocolFileV1<AppData>
export type ProtocolFileV3<AppData> = _ProtocolFileV3<AppData>
export type ProtocolFileV4<AppData> = _ProtocolFileV4<AppData>
export type ProtocolFileV5<AppData> = _ProtocolFileV5<AppData>

export type JsonProtocolFile =
  | Readonly<ProtocolFileV1<{}>>
  | Readonly<ProtocolFileV3<{}>>
  | Readonly<ProtocolFileV4<{}>>
  | Readonly<ProtocolFileV5<{}>>

export * from './types/schemaV6'
