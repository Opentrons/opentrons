import type { ProtocolFileV5 } from '@opentrons/shared-data'
import type {
  UncheckedProtocolFile,
  CheckedProtocolFile,
} from '@opentrons/app/src/redux/protocol-storage/types'

export function sameIdentity(a: any, b: any): boolean {
  return (
    a.definition != null &&
    b.definition != null &&
    a.definition.parameters.loadName === b.definition.parameters.loadName &&
    a.definition.version === b.definition.version &&
    a.definition.namespace === b.definition.namespace
  )
}

// TODO: IMMEDIATELY validate with shared-data utils
const validateProtocol = (data: any): ProtocolFileV5<{}> | null => data

// validate a collection of unchecked labware files
export function validateProtocolFiles(
  files: UncheckedProtocolFile[]
): CheckedProtocolFile[] {
  return files.map<CheckedProtocolFile>(file => {
    const { filename, data, modified } = file

    // check file against the schema
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const protocol = data && validateProtocol(data)

    return { filename, modified, protocol }
  })
}
