import type { ProtocolFile as ProtocolFileV1 } from './types/schemaV1'
import type { ProtocolFile as ProtocolFileV3 } from './types/schemaV3'
import type { ProtocolFile as ProtocolFileV4 } from './types/schemaV4'
import type { ProtocolFile as ProtocolFileV5 } from './types/schemaV5'
import type { ProtocolFile as ProtocolFileV6 } from './types/schemaV6'
import type { ProtocolFile as ProtocolFileV7 } from './types/schemaV7'

export type {
  ProtocolFileV1,
  ProtocolFileV3,
  ProtocolFileV4,
  ProtocolFileV5,
  ProtocolFileV6,
  ProtocolFileV7,
}
export type JsonProtocolFile =
  | Readonly<ProtocolFileV1<{}>>
  | Readonly<ProtocolFileV3<{}>>
  | Readonly<ProtocolFileV4<{}>>
  | Readonly<ProtocolFileV5<{}>>
  | Readonly<ProtocolFileV6<{}>>
  | Readonly<ProtocolFileV7<{}>>

export * from './types/schemaV7'
