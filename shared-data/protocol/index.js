// @flow
import type { SchemaV1ProtocolFile } from './flowTypes/schemaV1'
import type { SchemaV3ProtocolFile } from './flowTypes/schemaV3'

type ProtocolData =
  | $Shape<SchemaV1ProtocolFile<{}>>
  | $Shape<SchemaV3ProtocolFile<{}>>

// $FlowFixMe: (ka, 2019-06-10): cant differentiate which file schema file is needed
export function getProtocolSchemaVersion(data: ProtocolData): ?number {
  if (data.schemaVersion) {
    return data.schemaVersion
  } else if (data['protocol-schema']) {
    return Number(data['protocol-schema'].charAt(0))
  }
  return null
}

export * from './flowTypes/schemaV1'
export * from './flowTypes/schemaV3'
