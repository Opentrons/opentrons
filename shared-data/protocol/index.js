// @flow
import type { ProtocolFile as SchemaV1ProtocolFile } from './flowTypes/schemaV1'
import type { ProtocolFile as SchemaV3ProtocolFile } from './flowTypes/schemaV3'

type ProtocolData =
  | $Shape<SchemaV1ProtocolFile<{}>>
  | $Shape<SchemaV3ProtocolFile<{}>>

export function getProtocolSchemaVersion(data: ProtocolData): ?number {
  // $FlowFixMe: (ka, 2019-06-10): cant differentiate which file schema file is needed
  if (data.schemaVersion > 3) {
    console.warn('this is protocol schema version is not yet supported')
  }
  if (data.schemaVersion === 3) {
    return 3
  } else if (data['protocol-schema'] === '2.0.0') {
    return 2
  } else if (data['protocol-schema'] === '1.0.0') {
    return 1
  }
  return null
}
