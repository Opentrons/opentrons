import type { ProtocolFile as ProtocolFileV1 } from './types/schemaV1'
import type { ProtocolFile as ProtocolFileV3 } from './types/schemaV3'
import type { ProtocolFile as ProtocolFileV4 } from './types/schemaV4'
import type { ProtocolFile as ProtocolFileV5 } from './types/schemaV5'
import type { ProtocolFile as ProtocolFileV6 } from './types/schemaV6'
import type { ProtocolFile as ProtocolFileV7 } from './types/schemaV7'
import type {
  ProtocolFile as ProtocolFileV8,
  ProtocolStructure as ProtocolStructureV8,
} from './types/schemaV8'
import protocolSchemaV1 from './schemas/1.json'
import protocolSchemaV2 from './schemas/2.json'
import protocolSchemaV3 from './schemas/3.json'
import protocolSchemaV4 from './schemas/4.json'
import protocolSchemaV5 from './schemas/5.json'
import protocolSchemaV6 from './schemas/6.json'
import protocolSchemaV7 from './schemas/7.json'
import protocolSchemaV8 from './schemas/8.json'

export type {
  ProtocolFileV1,
  ProtocolFileV3,
  ProtocolFileV4,
  ProtocolFileV5,
  ProtocolFileV6,
  ProtocolFileV7,
  ProtocolFileV8,
  ProtocolStructureV8,
}

export type JsonProtocolFile =
  | Readonly<ProtocolFileV1<{}>>
  | Readonly<ProtocolFileV3<{}>>
  | Readonly<ProtocolFileV4<{}>>
  | Readonly<ProtocolFileV5<{}>>
  | Readonly<ProtocolFileV6<{}>>
  | Readonly<ProtocolFileV7<{}>>
  | Readonly<ProtocolFileV8<{}>>

export * from './types/schemaV8'

export {
  protocolSchemaV1,
  protocolSchemaV2,
  protocolSchemaV3,
  protocolSchemaV4,
  protocolSchemaV5,
  protocolSchemaV6,
  protocolSchemaV7,
  protocolSchemaV8,
}
